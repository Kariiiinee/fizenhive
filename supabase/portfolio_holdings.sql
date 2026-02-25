-- Fizenhive Supabase Setup: Portfolio Holdings
-- Run this script in your Supabase SQL Editor to create the necessary table for the Dashboard

CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    name TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    buy_price NUMERIC NOT NULL DEFAULT 0,
    price_aim NUMERIC,
    portfolio_id TEXT DEFAULT 'Main',
    date_bought DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own holdings" 
    ON public.portfolio_holdings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings" 
    ON public.portfolio_holdings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" 
    ON public.portfolio_holdings FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings" 
    ON public.portfolio_holdings FOR DELETE 
    USING (auth.uid() = user_id);
