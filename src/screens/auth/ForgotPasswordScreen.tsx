import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Illustration } from '../../components/ui/Illustration';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { Colors, Spacing, FontSize } from '../../constants/theme';

type FormData = { email: string };

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t.auth.validation.emailInvalid),
      }),
    [t]
  );

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
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={18} color={Colors.primary} />
            <Text style={styles.backText}>{t.common.back}</Text>
          </TouchableOpacity>
          <LanguageToggle />
        </View>

        <View style={styles.header}>
          <Illustration name={sent ? 'emailSent' : 'forgotPassword'} width={190} height={140} />
          <Text style={styles.title}>{t.auth.resetPasswordTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.resetPasswordSubtitle}</Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>{t.auth.checkInboxTitle}</Text>
            <Text style={styles.successText}>{t.auth.checkInboxMsg}</Text>
            <Button
              title={t.auth.backToSignIn}
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        ) : (
          <>
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
            <Button title={t.auth.sendResetLink} onPress={handleSubmit(onSubmit)} loading={loading} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.warmwhite },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.xl },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  successBox: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.mint, borderRadius: 16 },
  successTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  successText: { fontSize: FontSize.sm, color: Colors.navy, textAlign: 'center', lineHeight: 20 },
});
