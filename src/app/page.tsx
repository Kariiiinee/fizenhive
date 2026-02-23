"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { Plus, Loader2, Info, Edit2, Check, X, Trash2, LogOut, Settings, Download, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
function DashboardContent() {
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
  const [editForm, setEditForm] = useState({ quantity: 0, buy_price: 0, price_aim: 0, date_bought: '' });

  // Chart state
  const [chartRange, setChartRange] = useState("1M");
  const chartRanges = ["1D", "1W", "1M", "YTD", "1Y", "2Y", "5Y"];

  // Authentication
  const [userId, setUserId] = useState<string | null>(null);

  // Portfolio Tabs
  const [portfolios, setPortfolios] = useState<any[]>([{ id: 'Main', name: 'Main Portfolio' }]);
  const [activePortfolioId, setActivePortfolioId] = useState<string>('Main');
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [renamingPortfolioId, setRenamingPortfolioId] = useState<string | null>(null);
  const [renamePortfolioName, setRenamePortfolioName] = useState("");

  useEffect(() => {
    const savedTabs = localStorage.getItem('fizenhive_tabs');
    if (savedTabs) {
      setPortfolios(JSON.parse(savedTabs));
    }
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
          { id: '1', ticker: 'AAPL', quantity: 10, buy_price: 150.00, price_aim: 200.00, date_bought: '2023-01-15' },
          { id: '2', ticker: 'TSLA', quantity: 8, buy_price: 720.00, price_aim: 900.00, date_bought: '2021-11-04' },
          { id: '3', ticker: 'MSFT', quantity: 15, buy_price: 299.00, price_aim: 0, date_bought: '2024-02-10' },
          { id: '4', ticker: 'F', quantity: 25, buy_price: 12.00, price_aim: 15.00, date_bought: '2022-06-20' }
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
        id: h.id, ticker: h.ticker, quantity: h.quantity, buy_price: h.buy_price, price_aim: h.price_aim, date_bought: h.date_bought
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
          user_id: userId,
          portfolio_id: activePortfolioId,
          date_bought: new Date().toISOString().split('T')[0]
        };

        let updatedHoldings = [...holdings, newHolding];

        if (userId) {
          const { data: insertedData, error } = await supabase.from('portfolio_holdings').insert([{
            user_id: userId,
            ticker: symbol,
            quantity: 10,
            buy_price: current_price,
            price_aim: current_price * 1.2,
            portfolio_id: activePortfolioId,
            date_bought: new Date().toISOString().split('T')[0]
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
      price_aim: holding.price_aim || 0,
      date_bought: holding.date_bought || ''
    });
    setEditingId(holding.id);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const updatedHoldings = holdings.map(h => {
      if (h.id === editingId) {
        return { ...h, quantity: editForm.quantity, buy_price: editForm.buy_price, price_aim: editForm.price_aim, date_bought: editForm.date_bought };
      }
      return h;
    });

    setHoldings(updatedHoldings);
    saveToStorageOrDb(updatedHoldings);

    if (userId) {
      await supabase.from('portfolio_holdings')
        .update({ quantity: editForm.quantity, buy_price: editForm.buy_price, price_aim: editForm.price_aim, date_bought: editForm.date_bought })
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

  // Portfolio Tab Management
  const createPortfolioTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    const newId = newPortfolioName.trim().toLowerCase().replace(/\s+/g, '-');
    // Prevent duplicate IDs
    if (portfolios.some(p => p.id === newId)) {
      setIsAddingPortfolio(false);
      setNewPortfolioName("");
      return;
    }

    const newTabs = [...portfolios, { id: newId, name: newPortfolioName.trim() }];
    setPortfolios(newTabs);
    localStorage.setItem('fizenhive_tabs', JSON.stringify(newTabs));
    setActivePortfolioId(newId);
    setNewPortfolioName("");
    setIsAddingPortfolio(false);
  };

  const startRenamingTab = (id: string, currentName: string) => {
    setRenamingPortfolioId(id);
    setRenamePortfolioName(currentName);
  };

  const submitRenameTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingPortfolioId || !renamePortfolioName.trim()) return;

    const updatedTabs = portfolios.map(p =>
      p.id === renamingPortfolioId ? { ...p, name: renamePortfolioName.trim() } : p
    );

    setPortfolios(updatedTabs);
    localStorage.setItem('fizenhive_tabs', JSON.stringify(updatedTabs));
    setRenamingPortfolioId(null);
  };

  // Calculations
  const filteredHoldings = holdings.filter(h => (h.portfolio_id || 'Main') === activePortfolioId);

  const metrics = filteredHoldings.map(h => {
    const totalInvested = h.quantity * h.buy_price;
    const currentValue = h.quantity * h.current_price;
    const totalReturn = currentValue - totalInvested;
    const roiPercentage = h.buy_price > 0 ? ((h.current_price - h.buy_price) / h.buy_price) * 100 : 0;
    const returnTarget = h.price_aim ? (h.price_aim - h.buy_price) * h.quantity : 0;

    const targetRoiPercentage = h.buy_price > 0 && h.price_aim ? ((h.price_aim - h.buy_price) / h.buy_price) * 100 : 0;

    return {
      ...h,
      totalInvested,
      currentValue,
      totalReturn,
      roiPercentage,
      returnTarget,
      targetRoiPercentage
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
      return Array.from({ length: 7 }).map((_, i) => ({ date: `Day ${i + 1}`, portfolio: 0, contribution: 0 }));
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
      data.push({
        date: `T-${points - i - 1}${labelExt}`,
        portfolio: variedVal,
        contribution: grandTotalInvested
      });
      runningVal += step;
    }
    data.push({ date: 'Now', portfolio: grandTotalCurrentValue, contribution: grandTotalInvested });
    return data;
  }, [grandTotalCurrentValue, grandTotalInvested, metrics.length, chartRange]);

  const downloadPortfolioAsCSV = () => {
    if (metrics.length === 0) return;

    const headers = [
      "Ticker", "Month Bought", "Quantity", "Avg Cost", "Total Invested",
      "Current Price", "Current Value", "Current ROI %", "Target Price",
      "Target ROI %", "Return Target", "Total Return"
    ];

    const csvRows = [
      headers.join(","),
      ...metrics.map(row => [
        row.ticker,
        row.date_bought || "",
        row.quantity,
        row.buy_price,
        row.totalInvested.toFixed(2),
        row.current_price,
        row.currentValue.toFixed(2),
        row.roiPercentage.toFixed(2) + "%",
        row.price_aim || "",
        row.price_aim ? row.targetRoiPercentage.toFixed(2) + "%" : "",
        row.price_aim ? row.returnTarget.toFixed(2) : "",
        row.totalReturn.toFixed(2)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const filename = `FizenHive_Portfolio_${new Date().toISOString().split('T')[0]}.csv`;



    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const downloadPortfolioAsPDF = () => {
    // We use the native print dialog formatted via CSS to generate high-quality vector PDFs
    // bypassing the limitations of HTML canvas libraries parsing modern CSS colors (oklch/oklab).
    window.print();
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading Portfolio...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 p-4 md:p-8 pb-32 space-y-8 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-4">
      {/* Tiny Luxury Hero Section */}
      <div className="text-center space-y-2 mb-8 md:mb-12 mt-4 cursor-default">
        <h1 className="text-[2.5rem] leading-[1.1] md:text-5xl font-bold tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80">
          Invest with clarity, simply.
        </h1>
        <p className="text-[15px] md:text-base text-muted-foreground font-medium tracking-tight max-w-sm mx-auto leading-relaxed">
          Build, analyze, and track your portfolio in one space.
        </p>
      </div>

      {/* Emerald Divider */}
      <div className="h-px w-full max-w-3xl mx-auto bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent my-8 print-hidden"></div>

      {/* Portfolio Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide print-hidden">
        {portfolios.map(p => (
          <div key={p.id}>
            {renamingPortfolioId === p.id ? (
              <form onSubmit={submitRenameTab} className="flex items-center gap-1.5 bg-muted/30 px-1 py-1 rounded-full">
                <input
                  autoFocus
                  type="text"
                  value={renamePortfolioName}
                  onChange={e => setRenamePortfolioName(e.target.value)}
                  onBlur={() => setRenamingPortfolioId(null)}
                  className="px-3 py-1 text-sm border focus:outline-none focus:border-primary bg-background w-32 rounded-full shadow-sm"
                />
              </form>
            ) : (
              <button
                onClick={() => setActivePortfolioId(p.id)}
                onDoubleClick={() => startRenamingTab(p.id, p.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 group ${activePortfolioId === p.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                <span>{p.name}</span>
                {activePortfolioId === p.id && p.id !== 'Main' && (
                  <Edit2
                    onClick={(e) => { e.stopPropagation(); startRenamingTab(p.id, p.name); }}
                    className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                )}
              </button>
            )}
          </div>
        ))}

        {isAddingPortfolio ? (
          <form onSubmit={createPortfolioTab} className="flex items-center gap-1.5 ml-1">
            <input
              autoFocus
              type="text"
              placeholder="Portfolio Name..."
              value={newPortfolioName}
              onChange={e => setNewPortfolioName(e.target.value)}
              className="px-3 py-1.5 rounded-full text-sm border focus:outline-none focus:border-primary bg-background w-32 shadow-sm"
            />
            <button type="submit" className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setIsAddingPortfolio(false)} className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingPortfolio(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all whitespace-nowrap ml-1"
          >
            <Plus className="w-4 h-4" /> New Tab
          </button>
        )}
      </div>

      {/* Portfolio Value Chart Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col mt-4">
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
                  minTickGap={30}
                />
                <YAxis
                  domain={[grandTotalInvested, 'auto']}
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
                  formatter={(value: any, name: any) => [
                    `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                    name === 'portfolio' ? 'Portfolio Value' : 'Total Contribution'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke={overallRoi >= 0 ? "#11d452" : "#ef4444"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
                <Area
                  type="monotone"
                  dataKey="contribution"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="4 4"
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

      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mt-2">
        <div className="bg-card border border-border rounded-xl p-2 sm:p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-1 sm:mb-2 line-clamp-1">Invested</p>
          <h3 className="text-xs sm:text-2xl font-bold truncate w-full">${grandTotalInvested.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-2 sm:p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-1 sm:mb-2 line-clamp-1">Current</p>
          <h3 className="text-xs sm:text-2xl font-bold truncate w-full">${grandTotalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-2 sm:p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-1 sm:mb-2 line-clamp-1">ROI</p>
          <h3 className={`text-xs sm:text-2xl font-bold truncate w-full ${overallRoi >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {overallRoi >= 0 ? '+' : ''}{overallRoi.toFixed(0)}%
          </h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-2 sm:p-5 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-1 sm:mb-2 line-clamp-1">Return</p>
          <h3 className={`text-xs sm:text-2xl font-bold truncate w-full ${grandTotalReturn >= 0 ? 'text-primary' : 'text-destructive'}`}>
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
          <span><strong>Tips:</strong> Target Price is your price aim for learning goals.</span>
        </div>
      </div>

      {addingSymbol && (
        <div className="flex items-center text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding {addingSymbol}...
        </div>
      )}

      {/* Scroll Hint for Mobile */}
      <div className="flex items-center justify-end mb-2 md:hidden text-xs text-muted-foreground animate-pulse print-hidden">
        <span>Scroll horizontally to see more columns</span>
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>

      <div className="print-section">
        {/* Print Header (Only visible when generating PDF via Print) */}
        <div className="hidden print:flex flex-row justify-between items-end mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/logo_fizenhive1.png" alt="FizenHive" className="w-10 h-10 rounded-xl object-cover shadow-sm" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">FizenHive</h1>
              <p className="text-sm text-muted-foreground">Invest with clarity, simply.</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-foreground">Portfolio Report</h2>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Main Table Layout */}
        <div className="bg-card border border-border rounded-xl overflow-x-auto print:overflow-visible print:border-none print:shadow-none shadow-sm">
          <table className="w-full text-xs sm:text-sm text-left print:text-[10px]">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr className="align-bottom">
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold w-12 print-hidden"></th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold whitespace-nowrap sticky left-0 z-20 bg-muted shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-bottom">Ticker</th>

                {/* New Month Bought Column */}
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center group cursor-help relative whitespace-nowrap align-bottom">
                  Mth<br />Bought
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                    When you initially opened this position.
                  </div>
                </th>

                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-right group cursor-help relative align-bottom">
                  Qty
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                    Number of shares you currently own.
                  </div>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center group cursor-help relative whitespace-nowrap align-bottom">
                  Avg<br />Cost
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                    The average cost per share you paid.
                  </div>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center group cursor-help relative whitespace-nowrap align-bottom">
                  Total<br />Invested
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                    Total amount of money initially put into this holding. (Qty * Price Bought)
                  </div>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center whitespace-nowrap align-bottom">Current<br />Price</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center group cursor-help relative whitespace-nowrap align-bottom">
                  Current<br />Value
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                    The value of your shares right now based on the Live Current Price.
                  </div>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center whitespace-nowrap align-bottom">Current<br />ROI %</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center whitespace-nowrap align-bottom">Total<br />Rtn</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center group cursor-help relative whitespace-nowrap align-bottom bg-primary/5">
                  Target<br />Price
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-foreground text-background text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal shadow-lg pointer-events-none text-center">
                    Your target price to sell or evaluate. Used to calculate Return Target.
                  </div>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center whitespace-nowrap align-bottom bg-primary/5">Target<br />ROI %</th>
                <th className="px-2 py-2 sm:px-3 sm:py-3 font-semibold text-center whitespace-nowrap align-bottom bg-primary/5">Target<br />Rtn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {metrics.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                    {/* Edit / Delete Buttons */}
                    <td className="px-2 py-3 sm:px-3 sm:py-4 w-12 text-center align-middle print-hidden">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button onClick={saveEdit} className="text-primary hover:text-primary/80"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-3 sm:gap-2 justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(row)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" /></button>
                          <button onClick={() => deleteHolding(row.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" /></button>
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 font-bold align-middle sticky left-0 z-10 bg-card text-primary shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-muted transition-colors">{row.ticker}</td>

                    {/* Mo. Bought Field */}
                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-left align-middle whitespace-nowrap text-muted-foreground text-sm">
                      {isEditing ? (
                        <input type="month" value={editForm.date_bought ? editForm.date_bought.substring(0, 7) : ''} onChange={e => setEditForm(p => ({ ...p, date_bought: e.target.value }))} className="w-32 bg-background border rounded px-2 py-1 text-sm focus:border-primary focus:outline-none" />
                      ) : (
                        <span>
                          {row.date_bought ? (() => {
                            const [y, m] = row.date_bought.split('-');
                            if (!y || !m) return '---';
                            const d = new Date(parseInt(y), parseInt(m) - 1);
                            return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', "'");
                          })() : '---'}
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle">
                      {isEditing ? (
                        <input type="number" value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} className="w-16 bg-background border rounded px-2 py-1 text-right focus:border-primary focus:outline-none ml-auto block" />
                      ) : (
                        <span>{row.quantity}</span>
                      )}
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle">
                      {isEditing ? (
                        <div className="flex items-center justify-end">
                          <span className="text-muted-foreground mr-1">$</span>
                          <input type="number" value={editForm.buy_price} onChange={e => setEditForm(p => ({ ...p, buy_price: parseFloat(e.target.value) || 0 }))} className="w-20 bg-background border rounded px-2 py-1 text-right focus:border-primary focus:outline-none" />
                        </div>
                      ) : (
                        <span className="font-medium">${row.buy_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle font-medium text-foreground/80">${row.totalInvested.toLocaleString()}</td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle font-bold">${row.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle font-semibold">${row.currentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle">
                      {/* Current ROI % */}
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${row.roiPercentage >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {row.roiPercentage >= 0 ? '+' : ''}{row.roiPercentage.toFixed(1)}% {row.roiPercentage >= 0 ? '▲' : '▼'}
                      </span>
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle font-bold border-l border-border/10">
                      {/* Total Return */}
                      <span className={row.totalReturn >= 0 ? 'text-primary' : 'text-destructive'}>
                        {row.totalReturn >= 0 ? '+' : '-'}${Math.abs(row.totalReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle bg-primary/5">
                      {isEditing ? (
                        <div className="flex items-center justify-end">
                          <span className="text-muted-foreground mr-1">$</span>
                          <input type="number" value={editForm.price_aim} onChange={e => setEditForm(p => ({ ...p, price_aim: parseFloat(e.target.value) || 0 }))} className="w-20 bg-background border rounded px-2 py-1 text-right focus:border-primary focus:outline-none" />
                        </div>
                      ) : (
                        <span>{row.price_aim ? `$${row.price_aim.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}</span>
                      )}
                    </td>

                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle bg-primary/5">
                      {/* Target ROI % */}
                      {row.price_aim ? (
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${row.targetRoiPercentage >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                          {row.targetRoiPercentage >= 0 ? '+' : ''}{row.targetRoiPercentage.toFixed(1)}% {row.targetRoiPercentage >= 0 ? '▲' : '▼'}
                        </span>
                      ) : '---'}
                    </td>
                    <td className="px-2 py-3 sm:px-3 sm:py-4 text-right align-middle font-medium bg-primary/5">
                      {/* Return Target */}
                      {row.price_aim ? (
                        <span className={row.returnTarget >= 0 ? 'text-primary' : 'text-destructive'}>
                          {row.returnTarget >= 0 ? '+' : '-'}${Math.abs(row.returnTarget).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      ) : '---'}
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
                  <td colSpan={5} className="px-2 py-3 sm:px-3 sm:py-4 text-left">Total</td>
                  <td className="px-2 py-3 sm:px-3 sm:py-4 text-right">${grandTotalInvested.toLocaleString()}</td>
                  <td colSpan={2} className="px-2 py-3 sm:px-3 sm:py-4 text-right">${grandTotalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>

                  <td className="px-2 py-3 sm:px-3 sm:py-4 text-right">
                    <span className={`px-2 py-1 rounded-md text-sm font-bold whitespace-nowrap ${overallRoi >= 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                      {overallRoi >= 0 ? '+' : ''}{overallRoi.toFixed(1)}% {overallRoi >= 0 ? '▲' : '▼'}
                    </span>
                  </td>

                  <td className="px-2 py-3 sm:px-3 sm:py-4 text-right border-l border-border/10">
                    <span className={grandTotalReturn >= 0 ? 'text-primary' : 'text-destructive'}>
                      {grandTotalReturn >= 0 ? '+' : '-'}${Math.abs(grandTotalReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </td>

                  <td colSpan={2} className="px-2 py-3 sm:px-3 sm:py-4 bg-primary/5">{/* Skip Target Price and Target ROI total */}</td>

                  <td className="px-2 py-3 sm:px-3 sm:py-4 text-right bg-primary/5">
                    <span className={grandTotalTargetReturn >= 0 ? 'text-primary' : 'text-destructive'}>
                      {grandTotalTargetReturn >= 0 ? '+' : '-'}${Math.abs(grandTotalTargetReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FizenHive. All rights reserved.
        </div>
      </div>

      {/* Download Buttons */}
      {metrics.length > 0 && (
        <div className="flex justify-end mt-2 px-1 gap-2 print-hidden">
          <button
            onClick={downloadPortfolioAsPDF}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/20 hover:bg-muted/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-border/50"
          >
            <FileText className="w-3.5 h-3.5" />
            Export as PDF
          </button>
          <button
            onClick={downloadPortfolioAsCSV}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/20 hover:bg-muted/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-border/50"
          >
            <Download className="w-3.5 h-3.5" />
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading Dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
