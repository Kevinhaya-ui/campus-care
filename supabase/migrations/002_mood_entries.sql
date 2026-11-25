-- =============================================================
-- 002: mood_entries
-- =============================================================
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood        TEXT NOT NULL,
  intensity   INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  triggers    JSONB DEFAULT '[]',
  reflection  TEXT,
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

DROP TRIGGER IF EXISTS mood_entries_updated_at ON public.mood_entries;
CREATE TRIGGER mood_entries_updated_at
  BEFORE UPDATE ON public.mood_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mood entries"
  ON public.mood_entries FOR ALL
  USING (auth.uid() = user_id);
