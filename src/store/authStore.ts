import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Language } from '../i18n/translations';

const LANG_STORAGE_KEY = 'campuscare_language';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  university: string | null;
  semester: number | null;
  preferred_language: string;
  communication_style: string;
  main_challenges: string[];
  wellness_goals: string[];
  preferred_check_in_time: string | null;
  onboarding_completed: boolean;
  tos_accepted: boolean;
  privacy_consent: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  language: Language;
  loading: boolean;
  // actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  initLanguage: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  language: 'id', // Primary language: Bahasa Indonesia
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null, loading: false });
  },

  setProfile: (profile) => set({ profile }),

  initLanguage: async () => {
    try {
      const saved = await SecureStore.getItemAsync(LANG_STORAGE_KEY);
      if (saved === 'id' || saved === 'en') {
        set({ language: saved });
      }
    } catch {
      // Fallback to default 'id'
    }
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    try {
      await SecureStore.setItemAsync(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage error on web
    }
    const { user, profile } = get();
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', user.id);
      if (profile) {
        set({ profile: { ...profile, preferred_language: lang } });
      }
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      const prof = data as Profile;
      const lang: Language = prof.preferred_language === 'en' ? 'en' : 'id';
      set({ profile: prof, language: lang });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
