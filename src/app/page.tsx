"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, Info, Edit2, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export default function Home() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Search state
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: 0, buy_price: 0, price_aim: 0 });

  // Chart state
  const [chartRange, setChartRange] = useState("1M");
  const chartRanges = ["1D", "1W", "1M", "YTD", "1Y", "2Y", "5Y"];

  // Authentication
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    setLoadingInitial(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      setUserId(session.user.id);
      const { data } = await supabase.from('portfolio_holdings').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true });
      if (data && data.length > 0) {
        await enhanceHoldingsWithLivePrices(data);
      } else {
        setHoldings([]);
        setLoadingInitial(false);
      }
    } else {
      // Fallback to local storage for demo if not logged in
      const local = localStorage.getItem('fizenhive_portfolio_demo');
      if (local) {
        await enhanceHoldingsWithLivePrices(JSON.parse(local));
      } else {
        // Default demo data
        const demo = [
          { id: '1', ticker: 'AAPL', quantity: 10, buy_price: 150.00, price_aim: 200.00 },
          { id: '2', ticker: 'TSLA', quantity: 8, buy_price: 720.00, price_aim: 900.00 },
          { id: '3', ticker: 'MSFT', quantity: 15, buy_price: 299.00, price_aim: 0 },
          { id: '4', ticker: 'F', quantity: 25, buy_price: 12.00, price_aim: 15.00 }
        ];
        await enhanceHoldingsWithLivePrices(demo);
      }
    }
  };

  const enhanceHoldingsWithLivePrices = async (baseHoldings: any[]) => {
    try {
      const enhanced = await Promise.all(baseHoldings.map(async (h) => {
        try {
          const res = await fetch(`/api/finance?symbol=${h.ticker}`);
          if (res.ok) {
            const quote = await res.json();
            return { ...h, current_price: quote.regularMarketPrice || h.buy_price };
          }
        } catch (e) { }
        return { ...h, current_price: h.buy_price };
      }));
      setHoldings(enhanced);
    } finally {
      setLoadingInitial(false);
    }
  };

  const saveToStorageOrDb = async (newHoldings: any[]) => {
    if (userId) {
      // If the user manually edits, we do granular updates. 
      // For now, this helper mainly handles local storage fallback.
    } else {
      localStorage.setItem('fizenhive_portfolio_demo', JSON.stringify(newHoldings.map(h => ({
        id: h.id, ticker: h.ticker, quantity: h.quantity, buy_price: h.buy_price, price_aim: h.price_aim
      }))));
    }
  };

  // Search Debounce Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (inputValue.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/finance/search?q=${encodeURIComponent(inputValue)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  const handleSelectStock = async (symbol: string) => {
    setShowDropdown(false);
    setInputValue("");
    setAddingSymbol(symbol);

    // Avoid exact duplicate ticker
    if (holdings.some(h => h.ticker === symbol)) {
      setAddingSymbol(null);
      setIsAdding(false);
      return;
    }

    try {
      const res = await fetch(`/api/finance?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        const current_price = data.regularMarketPrice || 0;

        const newHolding = {
          id: Math.random().toString(36).substr(2, 9),
          ticker: symbol,
          quantity: 10,
          buy_price: current_price,
          price_aim: current_price * 1.2,
          current_price,
          user_id: userId
        };

        let updatedHoldings = [...holdings, newHolding];

        if (userId) {
          const { data: insertedData, error } = await supabase.from('portfolio_holdings').insert([{
            user_id: userId,
            ticker: symbol,
            quantity: 10,
            buy_price: current_price,
            price_aim: current_price * 1.2
          }]).select();

          if (!error && insertedData && insertedData[0]) {
            updatedHoldings = [...holdings, { ...insertedData[0], current_price }];
          }
        }

        setHoldings(updatedHoldings);
        saveToStorageOrDb(updatedHoldings);
      }
    } catch (e) {
      console.error("Failed to add holding", e);
    } finally {
      setAddingSymbol(null);
      setIsAdding(false);
    }
  };

  const startEditing = (holding: any) => {
    setEditForm({
      quantity: holding.quantity || 0,
      buy_price: holding.buy_price || 0,
      price_aim: holding.price_aim || 0
    });
    setEditingId(holding.id);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const updatedHoldings = holdings.map(h => {
      if (h.id === editingId) {
        return { ...h, quantity: editForm.quantity, buy_price: editForm.buy_price, price_aim: editForm.price_aim };
      }
      return h;
    });

    setHoldings(updatedHoldings);
    saveToStorageOrDb(updatedHoldings);

    if (userId) {
      await supabase.from('portfolio_holdings')
        .update({ quantity: editForm.quantity, buy_price: editForm.buy_price, price_aim: editForm.price_aim })
        .eq('id', editingId)
        .eq('user_id', userId);
    }

    setEditingId(null);
  };

  const deleteHolding = async (id: string) => {
    const updatedHoldings = holdings.filter(h => h.id !== id);
    setHoldings(updatedHoldings);
    saveToStorageOrDb(updatedHoldings);

    if (userId) {
      await supabase.from('portfolio_holdings').delete().eq('id', id).eq('user_id', userId);
    }
  };

  // Calculations
  const metrics = holdings.map(h => {
    const totalInvested = h.quantity * h.buy_price;
    const currentValue = h.quantity * h.current_price;
    const totalReturn = currentValue - totalInvested;
    const roiPercentage = h.buy_price > 0 ? ((h.current_price - h.buy_price) / h.buy_price) * 100 : 0;
    const returnTarget = h.price_aim ? (h.price_aim - h.buy_price) * h.quantity : 0;

    return {
      ...h,
      totalInvested,
      currentValue,
      totalReturn,
      roiPercentage,
      returnTarget
    };
  });

  const grandTotalInvested = metrics.reduce((acc, h) => acc + h.totalInvested, 0);
  const grandTotalCurrentValue = metrics.reduce((acc, h) => acc + h.currentValue, 0);
  const grandTotalReturn = grandTotalCurrentValue - grandTotalInvested;
  const overallRoi = grandTotalInvested > 0 ? (grandTotalReturn / grandTotalInvested) * 100 : 0;
  const grandTotalTargetReturn = metrics.reduce((acc, h) => acc + h.returnTarget, 0);

  // Generate a deterministic progression to populate the visual chart without causing re-render jitter
  const chartData = useMemo(() => {
    if (metrics.length === 0) {
      return Array.from({ length: 7 }).map((_, i) => ({ date: `Day ${i + 1}`, value: 0 }));
    }

    let points = 7;
    let labelExt = "D";
    if (chartRange === "1D") { points = 8; labelExt = "H"; }
    else if (chartRange === "1W") { points = 7; labelExt = "D"; }
    else if (chartRange === "1M") { points = 30; labelExt = "D"; }
    else if (chartRange === "YTD") { points = 12; labelExt = "M"; }
    else if (chartRange === "1Y") { points = 12; labelExt = "M"; }
    else if (chartRange === "2Y") { points = 24; labelExt = "M"; }
    else if (chartRange === "5Y") { points = 60; labelExt = "M"; }

    const totalChange = grandTotalCurrentValue - grandTotalInvested;
    const step = totalChange / (points - 1);

    let runningVal = grandTotalInvested;
    const data = [];
    for (let i = 0; i < points - 1; i++) {
      // Deterministic pseudo-random noise using sine waves
      const noise = (Math.sin(i * 0.8) * 0.015) + (Math.cos(i * 2.3) * 0.01);
      const variedVal = runningVal * (1 + noise);
      data.push({ date: `T-${points - i - 1}${labelExt}`, value: variedVal });
      runningVal += step;
    }
    data.push({ date: 'Now', value: grandTotalCurrentValue });
    return data;
  }, [grandTotalCurrentValue, grandTotalInvested, metrics.length, chartRange]);

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading Portfolio...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-2">
        <h1 className="text-2xl font-bold tracking-tight">FizenHive</h1>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="text-primary font-bold text-sm">KS</span>
        </div>
      </header>

      {/* Portfolio Value Chart Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col mt-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Portfolio Value</p>
            <div className="flex items-end gap-3">
              <h2 className="text-4xl font-bold tracking-tight">${grandTotalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h2>
              <span className={`text-sm font-semibold mb-1 px-2 py-0.5 rounded-md ${overallRoi >= 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {overallRoi >= 0 ? '+' : ''}{overallRoi.toFixed(2)}% All Time
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {chartRanges.map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartRange === range
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Functional Recharts Chart */}
        <div className="h-48 w-full mt-2">
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={overallRoi >= 0 ? "#11d452" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={overallRoi >= 0 ? "#11d452" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  formatter={(value: any) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={overallRoi >= 0 ? "#11d452" : "#ef4444"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
              Add holding to see your performance graph
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium mb-2">Total Invested:</p>
          <h3 className="text-2xl font-bold">${grandTotalInvested.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium mb-2">Current Value:</p>
          <h3 className="text-2xl font-bold">${grandTotalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium mb-2">Overall ROI:</p>
          <h3 className={`text-2xl font-bold ${overallRoi >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {overallRoi.toFixed(0)}%
          </h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium mb-2">Total Return:</p>
          <h3 className={`text-2xl font-bold ${grandTotalReturn >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {grandTotalReturn >= 0 ? '+' : ''}${grandTotalReturn.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h3>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Add Investment
            </button>
          ) : (
            <div className="relative z-50 w-full sm:w-64">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search to add (e.g. AAPL)"
                className="w-full bg-card border border-border rounded-lg py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                autoFocus
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
              ) : (
                <button onClick={() => setIsAdding(false)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-b-0 flex items-center justify-between"
                      onClick={() => handleSelectStock(result.symbol)}
                    >
                      <div className="truncate pr-4">
                        <div className="font-semibold text-sm">{result.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">{result.shortname}</div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-lg text-sm text-muted-foreground border border-border/50">
          <Info className="w-4 h-4 shrink-0" />
          <span><strong>Tips:</strong> Price aim is your target price for learning goals.</span>
        </div>
      </div>

      {addingSymbol && (
        <div className="flex items-center text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding {addingSymbol}...
        </div>
      )}

      {/* Main Table Layout */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold w-12"></th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap sticky left-0 z-20 bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Ticker</th>
              <th className="px-4 py-3 font-semibold text-right group cursor-help relative">
                Quantity
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                  Number of shares you currently own.
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-right group cursor-help relative whitespace-nowrap">
                Price Bought
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                  The average cost per share you paid.
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-right group cursor-help relative whitespace-nowrap">
                Total Invested
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                  Total amount of money initially put into this holding. (Qty * Price Bought)
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Current Price</th>
              <th className="px-4 py-3 font-semibold text-right group cursor-help relative whitespace-nowrap">
                Current Value
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                  The value of your shares right now based on the Live Current Price.
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-right group cursor-help relative whitespace-nowrap">
                Price Aim
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                  Your target price to sell or evaluate. Used to calculate Return Target.
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">ROI %</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Return Target</th>
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {metrics.map((row) => {
              const isEditing = editingId === row.id;

              return (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                  {/* Edit / Delete Buttons */}
                  <td className="px-4 py-4 w-12 text-center align-middle">
                    {isEditing ? (
                      <div className="flex gap-1 justify-center">
                        <button onClick={saveEdit} className="text-primary hover:text-primary/80"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(row)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteHolding(row.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 font-bold align-middle sticky left-0 z-10 bg-card text-primary shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted transition-colors">{row.ticker}</td>

                  <td className="px-4 py-4 text-right align-middle">
                    {isEditing ? (
                      <input type="number" value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} className="w-20 bg-background border rounded px-2 py-1 text-right focus:border-primary focus:outline-none ml-auto block" />
                    ) : (
                      <span>{row.quantity}</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right align-middle">
                    {isEditing ? (
                      <div className="flex items-center justify-end">
                        <span className="text-muted-foreground mr-1">$</span>
                        <input type="number" value={editForm.buy_price} onChange={e => setEditForm(p => ({ ...p, buy_price: parseFloat(e.target.value) || 0 }))} className="w-24 bg-background border rounded px-2 py-1 text-right focus:border-primary focus:outline-none" />
                      </div>
                    ) : (
                      <span className="font-medium">${row.buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right align-middle font-medium text-foreground/80">${row.totalInvested.toLocaleString()}</td>

                  <td className="px-4 py-4 text-right align-middle font-bold">${row.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                  <td className="px-4 py-4 text-right align-middle font-semibold">${row.currentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>

                  <td className="px-4 py-4 text-right align-middle">
                    {isEditing ? (
                      <div className="flex items-center justify-end">
                        <span className="text-muted-foreground mr-1">$</span>
                        <input type="number" value={editForm.price_aim} onChange={e => setEditForm(p => ({ ...p, price_aim: parseFloat(e.target.value) || 0 }))} className="w-24 bg-background border rounded px-2 py-1 text-right focus:border-primary focus:outline-none" />
                      </div>
                    ) : (
                      <span>{row.price_aim ? `$${row.price_aim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}</span>
                    )}
                  </td>

                  {/* ROI % */}
                  <td className="px-4 py-4 text-right align-middle">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${row.roiPercentage >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      {row.roiPercentage >= 0 ? '+' : ''}{row.roiPercentage.toFixed(1)}% {row.roiPercentage >= 0 ? '▲' : '▼'}
                    </span>
                  </td>

                  {/* Return Target */}
                  <td className="px-4 py-4 text-right align-middle font-medium">
                    {row.price_aim ? (
                      <span className={row.returnTarget >= 0 ? 'text-primary' : 'text-destructive'}>
                        {row.returnTarget >= 0 ? '+' : '-'}${Math.abs(row.returnTarget).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    ) : '---'}
                  </td>

                  {/* Total Return */}
                  <td className="px-4 py-4 text-right align-middle font-bold">
                    <span className={row.totalReturn >= 0 ? 'text-primary' : 'text-destructive'}>
                      {row.totalReturn >= 0 ? '+' : '-'}${Math.abs(row.totalReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </td>
                </tr>
              );
            })}

            {metrics.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                  No investments tracked yet. Click "Add Investment" to build your portfolio.
                </td>
              </tr>
            )}
          </tbody>

          {/* Table Footer Totals */}
          {metrics.length > 0 && (
            <tfoot className="bg-muted/30 border-t border-border font-bold">
              <tr>
                <td colSpan={4} className="px-4 py-4 text-left">Total</td>
                <td className="px-4 py-4 text-right">${grandTotalInvested.toLocaleString()}</td>
                <td colSpan={2} className="px-4 py-4 text-right">${grandTotalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-4"></td> {/* Skip Price aim total */}
                <td className="px-4 py-4 text-right">
                  <span className={`px-2 py-1 rounded-md text-sm font-bold whitespace-nowrap ${overallRoi >= 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                    {overallRoi >= 0 ? '+' : ''}{overallRoi.toFixed(1)}% {overallRoi >= 0 ? '▲' : '▼'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={grandTotalTargetReturn >= 0 ? 'text-primary' : 'text-destructive'}>
                    {grandTotalTargetReturn >= 0 ? '+' : '-'}${Math.abs(grandTotalTargetReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={grandTotalReturn >= 0 ? 'text-primary' : 'text-destructive'}>
                    {grandTotalReturn >= 0 ? '+' : '-'}${Math.abs(grandTotalReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
