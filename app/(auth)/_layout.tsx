import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthLayout() {
  const { session, profile } = useAuthStore();

  if (session) {
    if (profile && !profile.onboarding_completed) {
      return <Redirect href="/(app)/onboarding" />;
    }
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
