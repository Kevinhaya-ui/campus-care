import { useAuthStore } from '../store/authStore';
import { translations } from './translations';

export function useTranslation() {
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);

  return {
    t: translations[language],
    language,
    setLanguage,
  };
}
