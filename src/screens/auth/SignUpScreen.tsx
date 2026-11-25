import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, Spacing, FontSize } from '../../constants/theme';

const schema = z
  .object({
    fullName: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function SignUpScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!tosAccepted || !privacyConsent) {
      Alert.alert(
        'Consent Required',
        'Please accept the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            tos_accepted: tosAccepted,
            privacy_consent: privacyConsent,
          },
        },
      });

      if (error) throw error;

      // Update profile with name and consent
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').update({
          full_name: data.fullName,
          tos_accepted: tosAccepted,
          privacy_consent: privacyConsent,
        }).eq('id', session.user.id);
      }

      Alert.alert(
        'Account Created! 🎉',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Your personal space to understand your feelings and find support.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                placeholder="Your name or preferred display name"
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
                autoCapitalize="words"
              />
            )}
          />

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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="At least 8 characters"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                isPassword
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                isPassword
              />
            )}
          />

          {/* Consent */}
          <View style={styles.consentSection}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setTosAccepted(!tosAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, tosAccepted && styles.checkboxChecked]}>
                {tosAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.consentText}>
                I agree to the{' '}
                <Text style={styles.link}>Terms of Service</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setPrivacyConsent(!privacyConsent)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, privacyConsent && styles.checkboxChecked]}>
                {privacyConsent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.consentText}>
                I consent to the processing of my personal and health-related data as described in the{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyNoteText}>
                🔒 Your mental wellness data is private and encrypted. It is never shared without your explicit consent.
              </Text>
            </View>
          </View>

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.link}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.warmwhite },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  emoji: { fontSize: 48, marginBottom: Spacing.sm },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  form: { gap: 0 },
  consentSection: { marginVertical: Spacing.md, gap: Spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  consentText: { flex: 1, fontSize: FontSize.sm, color: Colors.navy, lineHeight: 20 },
  link: { color: Colors.primary, fontWeight: '600' },
  privacyNote: {
    backgroundColor: Colors.lavender,
    borderRadius: 10,
    padding: Spacing.sm,
    marginTop: 4,
  },
  privacyNoteText: { fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginText: { fontSize: FontSize.sm, color: Colors.muted },
});
