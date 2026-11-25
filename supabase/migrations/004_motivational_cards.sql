-- =============================================================
-- 004: motivational_cards
-- =============================================================
CREATE TABLE IF NOT EXISTS public.motivational_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  front_content TEXT NOT NULL,
  back_content  TEXT,
  category      TEXT NOT NULL,
  author        TEXT,
  published     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Public read, admin write (enforced at application level)
ALTER TABLE public.motivational_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published cards"
  ON public.motivational_cards FOR SELECT
  USING (published = TRUE);

-- Saved cards (favourites)
CREATE TABLE IF NOT EXISTS public.saved_cards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id    UUID NOT NULL REFERENCES public.motivational_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, card_id)
);

ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved cards"
  ON public.saved_cards FOR ALL
  USING (auth.uid() = user_id);

-- Seed a few sample cards
INSERT INTO public.motivational_cards (title, front_content, back_content, category, author) VALUES
  ('One Step at a Time', 'You don''t have to figure everything out today.', 'Progress is not always about moving faster. Sometimes it means allowing yourself to rest and taking one small step forward.', 'Self-Love', 'CampusCare'),
  ('You Are Enough', 'You are more capable than you think.', 'Every challenge you have faced has made you stronger. Trust yourself — you have everything you need.', 'Confidence', 'CampusCare'),
  ('Breathe', 'When stress feels overwhelming, pause and breathe.', 'Take a slow, deep breath in for 4 counts, hold for 4, and release for 4. Your nervous system will thank you.', 'Stress Management', 'CampusCare'),
  ('Rest is Productive', 'Rest is not laziness — it is recovery.', 'Your brain and body need downtime to consolidate learning and restore energy. Resting is part of doing well.', 'Personal Growth', 'CampusCare'),
  ('Your Feelings Are Valid', 'Whatever you are feeling right now is okay.', 'You don''t need to justify your emotions. They are signals, not weaknesses. Notice them, name them, and treat yourself with kindness.', 'Emotional Awareness', 'CampusCare')
ON CONFLICT DO NOTHING;
