import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const STEPS = [
  {
    id: 'challenges',
    title: 'What are your biggest challenges right now?',
    subtitle: 'Select all that apply. This helps us personalize your experience.',
    emoji: '🌊',
    multi: true,
    options: [
      { label: 'Academic pressure', value: 'academic' },
      { label: 'Relationships', value: 'relationships' },
      { label: 'Financial difficulties', value: 'financial' },
      { label: 'Personal development', value: 'personal' },
      { label: 'Family', value: 'family' },
      { label: 'Other', value: 'other' },
    ],
  },
  {
    id: 'goals',
    title: 'What would you like to improve?',
    subtitle: 'Choose your wellness goals.',
    emoji: '🌟',
    multi: true,
    options: [
      { label: 'Understanding my emotions', value: 'emotions' },
      { label: 'Managing stress', value: 'stress' },
      { label: 'Building confidence', value: 'confidence' },
      { label: 'Improving sleep habits', value: 'sleep' },
      { label: 'Developing healthier routines', value: 'routines' },
    ],
  },
  {
    id: 'communication',
    title: 'How would you prefer your AI companion to communicate?',
    subtitle: 'You can change this anytime in settings.',
    emoji: '💬',
    multi: false,
    options: [
      { label: '😊 Friendly and casual', value: 'friendly' },
      { label: '🌿 Calm and supportive', value: 'calm' },
      { label: '🔥 Motivational and encouraging', value: 'motivational' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    challenges: [],
    goals: [],
    communication: 'friendly',
  });
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];

  const toggleOption = (value: string) => {
    const key = current.id === 'challenges' ? 'challenges' : current.id === 'goals' ? 'goals' : 'communication';
    if (current.multi) {
      const current_vals = answers[key] as string[];
      setAnswers({
        ...answers,
        [key]: current_vals.includes(value)
          ? current_vals.filter((v) => v !== value)
          : [...current_vals, value],
      });
    } else {
      setAnswers({ ...answers, [key]: value });
    }
  };

  const isSelected = (value: string) => {
    const key = current.id === 'challenges' ? 'challenges' : current.id === 'goals' ? 'goals' : 'communication';
    const val = answers[key];
    return Array.isArray(val) ? val.includes(value) : val === value;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
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
      Alert.alert('Error', error.message);
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
        {/* Progress */}
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {current.options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isSelected(opt.value) && styles.optionSelected]}
              onPress={() => toggleOption(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, isSelected(opt.value) && styles.optionTextSelected]}>
                {opt.label}
              </Text>
              {isSelected(opt.value) && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={step < STEPS.length - 1 ? 'Next' : 'Get Started'}
            onPress={handleNext}
            loading={loading}
          />
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
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
  progress: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.success },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  emoji: { fontSize: 44, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy, textAlign: 'center', marginBottom: 8 },
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
  optionText: { fontSize: FontSize.base, color: Colors.navy },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
  check: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.base },
  actions: { gap: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.muted, fontSize: FontSize.sm },
});
