import React, { useMemo, useState } from 'react';
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
import { Check, Lock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Illustration } from '../../components/ui/Illustration';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { Colors, Spacing, FontSize } from '../../constants/theme';

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUpScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().min(2, t.auth.validation.fullNameMin),
          email: z.string().email(t.auth.validation.emailInvalid),
          password: z.string().min(8, t.auth.validation.passwordMin),
          confirmPassword: z.string(),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t.auth.validation.passwordMismatch,
          path: ['confirmPassword'],
        }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!tosAccepted || !privacyConsent) {
      Alert.alert(t.auth.consentRequiredTitle, t.auth.consentRequiredMsg);
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

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').update({
          full_name: data.fullName,
          preferred_language: language,
          tos_accepted: tosAccepted,
          privacy_consent: privacyConsent,
        }).eq('id', session.user.id);
      }

      Alert.alert(
        t.auth.accountCreatedTitle,
        t.auth.accountCreatedMsg,
        [{ text: t.auth.signIn, onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert(t.auth.signupFailed, error.message);
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
        <View style={styles.topBar}>
          <LanguageToggle />
        </View>

        <View style={styles.header}>
          <Illustration name="signup" width={200} height={140} />
          <Text style={styles.title}>{t.auth.createAccount}</Text>
          <Text style={styles.subtitle}>{t.auth.signupSubtitle}</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t.auth.fullNameLabel}
                placeholder={t.auth.fullNamePlaceholder}
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
                label={t.auth.emailLabel}
                placeholder={t.auth.emailPlaceholder}
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
                label={t.auth.passwordLabel}
                placeholder={t.auth.passwordMinPlaceholder}
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
                label={t.auth.confirmPasswordLabel}
                placeholder={t.auth.confirmPasswordPlaceholder}
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                isPassword
              />
            )}
          />

          <View style={styles.consentSection}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setTosAccepted(!tosAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, tosAccepted && styles.checkboxChecked]}>
                {tosAccepted && <Check size={14} color={Colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.consentText}>
                {t.auth.agreeTosPrefix}
                <Text style={styles.link}>{t.auth.tosLink}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setPrivacyConsent(!privacyConsent)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, privacyConsent && styles.checkboxChecked]}>
                {privacyConsent && <Check size={14} color={Colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.consentText}>
                {t.auth.agreePrivacyPrefix}
                <Text style={styles.link}>{t.auth.privacyLink}</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Lock size={16} color={Colors.primary} style={styles.lockIcon} />
              <Text style={styles.privacyNoteText}>{t.auth.privacyNote}</Text>
            </View>
          </View>

          <Button
            title={t.auth.createAccount}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginText}>
              {t.auth.alreadyHaveAccount}{' '}
              <Text style={styles.link}>{t.auth.signIn}</Text>
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.xl },
  topBar: { alignItems: 'flex-end', marginBottom: Spacing.sm },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, marginBottom: 6 },
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
  consentText: { flex: 1, fontSize: FontSize.sm, color: Colors.navy, lineHeight: 20 },
  link: { color: Colors.primary, fontWeight: '600' },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.lavender,
    borderRadius: 10,
    padding: Spacing.sm,
    marginTop: 4,
  },
  lockIcon: { marginTop: 2 },
  privacyNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginText: { fontSize: FontSize.sm, color: Colors.muted },
});
