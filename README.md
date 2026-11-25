# CampusCare

> A personalized mental wellness companion for Indonesian college students.

---

## 🚀 Detailed Local Setup Guide

### Prerequisites
- **Node.js** v18+ (tested with v22) and **npm** v9+
- **Supabase account** (free tier at [supabase.com](https://supabase.com))
- **Mobile device or emulator**:
  - Physical Android/iOS phone with the **Expo Go** app installed (must be on the same Wi-Fi network as your PC), **or**
  - **Android Studio** with an Android Virtual Device (AVD), **or**
  - **Xcode** (macOS only) for iOS Simulator

### Step 1: Install Dependencies
Open a terminal in the `campuscare` folder:
```bash
cd "d:\Master\APPDEV\Campus Care\campuscare"
npm install
```

### Step 2: Create a Supabase Project & Get API Keys
1. Go to [supabase.com](https://supabase.com) and click **New Project**.
2. Choose an organization, enter a project name (e.g., `campuscare-dev`), set a database password, and select a region close to you (e.g., **Singapore**).
3. Wait ~1–2 minutes for the database to finish provisioning.
4. In the left sidebar, go to **Project Settings** (gear icon) → **API**:
   - Copy **Project URL** (looks like `https://abcdefghijkl.supabase.co`).
   - Copy **Project API keys → `anon` `public`** key.

### Step 3: Configure Environment Variables (`.env`)
1. In `campuscare/`, copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   *(On macOS/Linux: `cp .env.example .env`)*
2. Open `.env` and paste your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   > ⚠️ **Note:** Restart the Expo dev server (`Ctrl+C`, then so) whenever you edit `.env`.

### Step 4: Run Database Migrations
1. In your Supabase dashboard, open **SQL Editor** from the left sidebar and click **New query**.
2. Run each migration file from `supabase/migrations/` **in exact order**:
   1. `supabase/migrations/001_profiles.sql` — creates `profiles`, auto-signup trigger, and RLS policies
   2. `supabase/migrations/002_mood_entries.sql` — creates `mood_entries` and RLS policies
   3. `supabase/migrations/003_journal_entries.sql` — creates `journal_entries` and RLS policies
   4. `supabase/migrations/004_motivational_cards.sql` — creates `motivational_cards`, `saved_cards`, seed cards, and RLS
   5. `supabase/migrations/005_conversations.sql` — creates `conversations`, `messages`, and RLS policies
3. Verify in **Table Editor** that all 7 tables exist and show **RLS enabled**.

### Step 5: Configure Supabase Authentication
1. Go to **Authentication → Providers → Email** and ensure **Enable Email provider** is turned on.
2. **Recommended for local testing:** Toggle **Confirm email** OFF under **Authentication → Providers → Email** so you can sign up and immediately proceed to onboarding without waiting for confirmation emails. *(Turn it back ON for production.)*

### Step 6: Start the Expo Development Server
Run inside `campuscare/`:
```bash
npx expo start
```
*(Use `npx expo start -c` if you need to clear the Metro cache after changing `.env` or `app.json`.)*

### Step 7: Open the App
- **Physical Phone (Recommended):**
  1. Ensure your phone and computer are on the **same Wi-Fi network**.
  2. Open **Expo Go** (Android) or the **Camera** app (iOS) and scan the QR code shown in the terminal.
  3. If your Wi-Fi blocks local connections (e.g., campus/corporate Wi-Fi), run `npx expo start --tunnel` instead.
- **Android Emulator:**
  1. Start your AVD in Android Studio, then press **`a`** in the Expo terminal (or run `npm run android`).
- **Web Browser (Quick UI preview):**
  1. Press **`w`** in the Expo terminal (or run `npm run web`). *(Note: `expo-secure-store` is native-only; for full auth testing use Expo Go or an emulator.)*

### Step 8: Verify Phase 1 Flows
1. **Sign Up:** Open the app → tap **Create one** → fill in name, email, password (8+ chars), check both consent boxes → tap **Create Account**.
2. **Onboarding:** Complete or skip the 3-step personalization questionnaire.
3. **Home Dashboard:** Confirm you see your personalized greeting, today's mood check-in card, daily motivational card, and quick-access tiles.
4. **Profile & Logout:** Go to the **Profile** tab → verify your details → tap **Sign Out** → sign back in on the Login screen.

---

## 📁 Project Structure

```
campuscare/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout (session listener)
│   ├── index.tsx           # Entry redirect
│   ├── (auth)/             # Auth screens (login, sign-up, forgot-password)
│   └── (app)/              # Authenticated screens
│       ├── onboarding.tsx
│       ├── ai-chat.tsx
│       └── (tabs)/         # Bottom tab navigator
│           ├── home.tsx
│           ├── mood.tsx
│           ├── journal.tsx
│           ├── discover.tsx
│           └── profile.tsx
├── src/
│   ├── components/ui/      # Reusable UI components (Button, Input, Card)
│   ├── constants/          # Design tokens (theme.ts)
│   ├── lib/                # Supabase client
│   ├── screens/            # Screen components
│   │   ├── auth/           # LoginScreen, SignUpScreen, ForgotPasswordScreen
│   │   ├── home/           # HomeScreen
│   │   └── onboarding/     # OnboardingScreen
│   └── store/              # Zustand state (authStore)
├── supabase/
│   └── migrations/         # PostgreSQL schema files (run in Supabase SQL Editor)
├── .env.example
├── app.json
└── tailwind.config.js
```

---

## 🏗️ Sprint Status

### Sprint 1 — Foundation ✅

| Feature | Status |
|---|---|
| Expo Router + TypeScript scaffold | ✅ Done |
| Supabase client + SecureStore session | ✅ Done |
| DB schema + RLS (profiles, mood, journal, cards) | ✅ Done |
| Sign Up (with TOS + Privacy consent) | ✅ Done |
| Login | ✅ Done |
| Forgot Password | ✅ Done |
| Onboarding questionnaire (3 steps) | ✅ Done |
| Home Dashboard | ✅ Done |
| Bottom tab navigation (5 tabs) | ✅ Done |
| Profile + Sign Out | ✅ Done |
| Design token system (PRD §5.2 colors) | ✅ Done |

### Next — Sprint 1 Continued
- [ ] Mood check-in flow (Module 2)
- [ ] Mood history & analytics
- [ ] Personal journal (Module 3)
- [ ] Motivational flashcards (Module 4)

---

## 🔐 Security Notes
- All API keys are stored in `.env` (never committed)
- Supabase sessions are stored in `expo-secure-store` (encrypted)
- RLS policies enforce per-user data isolation at the database level
- Journal entries are private by default — no sharing without explicit consent

## ⚠️ Limitations (MVP)
- AI Companion is a placeholder (Sprint 2)
- Professional directory is a placeholder (Sprint 4)
- Push notifications not yet configured
- Google OAuth not yet wired up
