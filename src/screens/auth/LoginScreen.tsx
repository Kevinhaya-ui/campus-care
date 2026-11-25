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
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Illustration } from '../../components/ui/Illustration';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { Colors, Spacing, FontSize } from '../../constants/theme';

type FormData = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t.auth.validation.emailInvalid),
        password: z.string().min(1, t.auth.validation.passwordRequired),
      }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      await fetchProfile();
    } catch (error: any) {
      Alert.alert(t.auth.signInFailed, error.message);
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
          <Illustration name="login" width={200} height={150} />
          <Text style={styles.title}>{t.auth.welcomeBack}</Text>
          <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>
        </View>

        <View style={styles.form}>
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
                placeholder={t.auth.passwordPlaceholder}
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                isPassword
              />
            )}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
          >
            <Text style={styles.link}>{t.auth.forgotPassword}</Text>
          </TouchableOpacity>

          <Button
            title={t.auth.signIn}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.replace('/(auth)/sign-up')}
          >
            <Text style={styles.signupText}>
              {t.auth.noAccount}{' '}
              <Text style={styles.link}>{t.auth.createOne}</Text>
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
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, marginBottom: 6 },
  subtitle: { fontSize: FontSize.base, color: Colors.muted, textAlign: 'center' },
  form: {},
  forgotLink: { alignItems: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm },
  link: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  signupLink: { alignItems: 'center', marginTop: Spacing.lg },
  signupText: { fontSize: FontSize.sm, color: Colors.muted },
});
