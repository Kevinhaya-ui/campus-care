import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { session, profile } = useAuthStore();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  if (session && profile && !profile.onboarding_completed) {
    return <Redirect href="/(app)/onboarding" />;
  }
  return <Redirect href="/(app)/(tabs)/home" />;
}
