import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Flame, Leaf, Smile } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/ui/Button';
import { Illustration, IllustrationName } from '../../components/ui/Illustration';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    challenges: [],
    goals: [],
    communication: 'friendly',
  });
  const [loading, setLoading] = useState(false);

  const steps = useMemo(
    () => [
      {
        id: 'challenges' as const,
        title: t.onboarding.challengesTitle,
        subtitle: t.onboarding.challengesSubtitle,
        illustration: 'challenges' as IllustrationName,
        multi: true,
        options: [
          { label: t.onboarding.options.academic, value: 'academic' },
          { label: t.onboarding.options.relationships, value: 'relationships' },
          { label: t.onboarding.options.financial, value: 'financial' },
          { label: t.onboarding.options.personal, value: 'personal' },
          { label: t.onboarding.options.family, value: 'family' },
          { label: t.onboarding.options.other, value: 'other' },
        ],
      },
      {
        id: 'goals' as const,
        title: t.onboarding.goalsTitle,
        subtitle: t.onboarding.goalsSubtitle,
        illustration: 'goals' as IllustrationName,
        multi: true,
        options: [
          { label: t.onboarding.options.emotions, value: 'emotions' },
          { label: t.onboarding.options.stress, value: 'stress' },
          { label: t.onboarding.options.confidence, value: 'confidence' },
          { label: t.onboarding.options.sleep, value: 'sleep' },
          { label: t.onboarding.options.routines, value: 'routines' },
        ],
      },
      {
        id: 'communication' as const,
        title: t.onboarding.communicationTitle,
        subtitle: t.onboarding.communicationSubtitle,
        illustration: 'communication' as IllustrationName,
        multi: false,
        options: [
          { label: t.onboarding.options.friendly, value: 'friendly', Icon: Smile },
          { label: t.onboarding.options.calm, value: 'calm', Icon: Leaf },
          { label: t.onboarding.options.motivational, value: 'motivational', Icon: Flame },
        ],
      },
    ],
    [t]
  );

  const current = steps[step];

  const toggleOption = (value: string) => {
    const key = current.id;
    if (current.multi) {
      const currentVals = answers[key] as string[];
      setAnswers({
        ...answers,
        [key]: currentVals.includes(value)
          ? currentVals.filter((v) => v !== value)
          : [...currentVals, value],
      });
    } else {
      setAnswers({ ...answers, [key]: value });
    }
  };

  const isSelected = (value: string) => {
    const val = answers[current.id];
    return Array.isArray(val) ? val.includes(value) : val === value;
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        main_challenges: answers.challenges,
        wellness_goals: answers.goals,
        communication_style: answers.communication as string,
        onboarding_completed: true,
      }).eq('id', user!.id);

      if (error) throw error;
      await fetchProfile();
      router.replace('/(app)/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user!.id);
      await fetchProfile();
      router.replace('/(app)/(tabs)/home');
    } catch {
      router.replace('/(app)/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        <View style={styles.header}>
          <Illustration name={current.illustration} width={190} height={135} />
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
        </View>

        <View style={styles.options}>
          {current.options.map((opt) => {
            const selected = isSelected(opt.value);
            const OptionIcon = 'Icon' in opt ? opt.Icon : undefined;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => toggleOption(opt.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  {OptionIcon && (
                    <OptionIcon
                      size={18}
                      color={selected ? Colors.primary : Colors.muted}
                    />
                  )}
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </View>
                {selected && <Check size={18} color={Colors.primary} strokeWidth={2.5} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            title={step < steps.length - 1 ? t.common.next : t.common.getStarted}
            onPress={handleNext}
            loading={loading}
          />
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t.common.skipForNow}</Text>
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
  progress: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.success },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy, textAlign: 'center', marginTop: Spacing.sm, marginBottom: 8 },
  subtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  options: { gap: Spacing.sm, marginBottom: Spacing.xl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.lavender },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  optionText: { fontSize: FontSize.base, color: Colors.navy },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
  actions: { gap: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.muted, fontSize: FontSize.sm },
});
