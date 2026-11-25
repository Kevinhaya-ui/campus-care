# CampusCare — Supabase Database Migrations

Run these in order inside the **Supabase SQL Editor** (or via `supabase db push`).

1. `001_profiles.sql` — User profiles, auto-creation trigger, and RLS
2. `002_mood_entries.sql` — Daily mood check-ins (1/day unique constraint) and RLS
3. `003_journal_entries.sql` — Private journal entries and RLS
4. `004_motivational_cards.sql` — Published motivational cards, saved cards, seed data, and RLS
5. `005_conversations.sql` — AI companion conversations & messages tables and RLS

Each file is located in `supabase/migrations/`.
