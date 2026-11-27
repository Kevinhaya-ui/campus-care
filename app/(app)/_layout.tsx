import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function AppLayout() {
  const { session } = useAuthStore();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="journal-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ai-chat" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
