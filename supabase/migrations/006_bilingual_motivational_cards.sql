-- =============================================================
-- 006: Add language support to motivational_cards & seed ID cards
-- =============================================================
ALTER TABLE public.motivational_cards
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

INSERT INTO public.motivational_cards (title, front_content, back_content, category, author, language) VALUES
  ('Selangkah Demi Selangkah', 'Kamu tidak harus menyelesaikan semuanya hari ini.', 'Kemajuan tidak selalu tentang bergerak lebih cepat. Terkadang artinya memberi dirimu ruang untuk beristirahat dan melangkah pelan ke depan.', 'Cinta Diri', 'CampusCare', 'id'),
  ('Kamu Cukup', 'Kamu jauh lebih mampu dari yang kamu kira.', 'Setiap tantangan yang pernah kamu hadapi telah membuatmu lebih kuat. Percayalah pada dirimu sendiri.', 'Kepercayaan Diri', 'CampusCare', 'id'),
  ('Tarik Napas', 'Saat stres terasa berat, berhenti sejenak dan tarik napas.', 'Tarik napas perlahan selama 4 hitungan, tahan 4 hitungan, lalu hembuskan 4 hitungan. Tubuh dan pikiranmu membutuhkannya.', 'Kelola Stres', 'CampusCare', 'id'),
  ('Istirahat Itu Produktif', 'Istirahat bukanlah kemalasan — itu adalah pemulihan.', 'Otak dan tubuhmu membutuhkan waktu jeda untuk memulihkan energi dan menjaga fokus belajarmu.', 'Pengembangan Diri', 'CampusCare', 'id'),
  ('Perasaanmu Valid', 'Apa pun yang kamu rasakan saat ini, itu tidak apa-apa.', 'Kamu tidak perlu membenarkan emosimu. Emosi adalah sinyal, bukan kelemahan. Kenali dan perlakukan dirimu dengan lembut.', 'Kesadaran Emosi', 'CampusCare', 'id')
ON CONFLICT DO NOTHING;
