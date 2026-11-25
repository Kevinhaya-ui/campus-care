import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, Spacing, FontSize } from '../../constants/theme';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: 'campuscare://reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a password reset link.
          </Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>📬</Text>
            <Text style={styles.successTitle}>Check your inbox</Text>
            <Text style={styles.successText}>
              We've sent a password reset link to your email. Please check your inbox and follow the instructions.
            </Text>
            <Button title="Back to Sign In" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="student@university.ac.id"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                />
              )}
            />
            <Button title="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.warmwhite },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  back: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  emoji: { fontSize: 48, marginBottom: Spacing.sm },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  successBox: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.mint, borderRadius: 16 },
  successEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  successTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  successText: { fontSize: FontSize.sm, color: Colors.navy, textAlign: 'center', lineHeight: 20 },
});
