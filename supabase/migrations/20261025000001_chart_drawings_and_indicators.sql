-- Migration: 20261025000001_chart_drawings_and_indicators.sql
-- Description: Stores user custom chart drawings, layout state, and indicator presets with Row Level Security.

CREATE TABLE IF NOT EXISTS public.chart_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    drawing_type VARCHAR(64) NOT NULL, -- 'HORIZONTAL_LINE', 'TREND_LINE', 'FIB_RETRACEMENT', 'RECTANGLE', 'TEXT'
    points JSONB NOT NULL DEFAULT '[]'::jsonb,
    style JSONB NOT NULL DEFAULT '{"color": "#3b82f6", "lineWidth": 2}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chart_indicator_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preset_name VARCHAR(64) NOT NULL,
    indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.chart_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_indicator_presets ENABLE ROW LEVEL SECURITY;

-- Policies for chart_drawings
CREATE POLICY "Users can view their own chart drawings"
    ON public.chart_drawings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chart drawings"
    ON public.chart_drawings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart drawings"
    ON public.chart_drawings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart drawings"
    ON public.chart_drawings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for chart_indicator_presets
CREATE POLICY "Users can view their own indicator presets"
    ON public.chart_indicator_presets
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own indicator presets"
    ON public.chart_indicator_presets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indicator presets"
    ON public.chart_indicator_presets
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indicator presets"
    ON public.chart_indicator_presets
    FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chart_drawings_user_symbol ON public.chart_drawings(user_id, symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_chart_presets_user ON public.chart_indicator_presets(user_id);
