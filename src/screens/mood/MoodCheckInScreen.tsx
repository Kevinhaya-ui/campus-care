import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  CheckCircle2,
  Frown,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { MOOD_OPTIONS, TRIGGER_KEYS, MoodEntryRow, MoodKey } from './moodMeta';

interface MoodCheckInScreenProps {
  onChanged?: () => void;
}

export default function MoodCheckInScreen({ onChanged }: MoodCheckInScreenProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState<MoodEntryRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [reflection, setReflection] = useState('');

  const today = dayjs().format('YYYY-MM-DD');

  const fetchTodayMood = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('id, mood, intensity, triggers, reflection, entry_date')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const entry: MoodEntryRow = {
          id: data.id,
          mood: data.mood as MoodKey,
          intensity: data.intensity,
          triggers: Array.isArray(data.triggers) ? data.triggers : [],
          reflection: data.reflection ?? '',
          entry_date: data.entry_date,
        };
        setExistingEntry(entry);
        setSelectedMood(entry.mood);
        setIntensity(entry.intensity);
        setSelectedTriggers(entry.triggers);
        setReflection(entry.reflection ?? '');
        setIsEditing(false);
      } else {
        setExistingEntry(null);
        setSelectedMood(null);
        setIntensity(3);
        setSelectedTriggers([]);
        setReflection('');
        setIsEditing(true);
      }
      setJustSubmitted(false);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
    }
  }, [user, today, t.common.error]);

  useFocusEffect(
    useCallback(() => {
      fetchTodayMood();
    }, [fetchTodayMood])
  );

  const toggleTrigger = (key: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    if (!selectedMood) {
      Alert.alert(t.moodCheckIn.selectMoodAlertTitle, t.moodCheckIn.selectMoodAlertMsg);
      return;
    }

    setSaving(true);
    try {
      if (existingEntry) {
        const { data, error } = await supabase
          .from('mood_entries')
          .update({
            mood: selectedMood,
            intensity,
            triggers: selectedTriggers,
            reflection: reflection.trim() || null,
          })
          .eq('id', existingEntry.id)
          .eq('user_id', user.id)
          .select('id, mood, intensity, triggers, reflection, entry_date')
          .single();

        if (error) throw error;
        setExistingEntry({
          id: data.id,
          mood: data.mood as MoodKey,
          intensity: data.intensity,
          triggers: Array.isArray(data.triggers) ? data.triggers : [],
          reflection: data.reflection ?? '',
          entry_date: data.entry_date,
        });
      } else {
        // Upsert on (user_id, entry_date) prevents duplicate daily check-ins
        const { data, error } = await supabase
          .from('mood_entries')
          .upsert(
            {
              user_id: user.id,
              mood: selectedMood,
              intensity,
              triggers: selectedTriggers,
              reflection: reflection.trim() || null,
              entry_date: today,
            },
            { onConflict: 'user_id,entry_date' }
          )
          .select('id, mood, intensity, triggers, reflection, entry_date')
          .single();

        if (error) throw error;
        setExistingEntry({
          id: data.id,
          mood: data.mood as MoodKey,
          intensity: data.intensity,
          triggers: Array.isArray(data.triggers) ? data.triggers : [],
          reflection: data.reflection ?? '',
          entry_date: data.entry_date,
        });
      }

      setIsEditing(false);
      setJustSubmitted(true);
      onChanged?.();
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingEntry || !user) return;
    Alert.alert(
      t.moodCheckIn.deleteConfirmTitle,
      t.moodCheckIn.deleteConfirmMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.moodCheckIn.deleteAction,
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const { error } = await supabase
                .from('mood_entries')
                .delete()
                .eq('id', existingEntry.id)
                .eq('user_id', user.id);

              if (error) throw error;
              setExistingEntry(null);
              setSelectedMood(null);
              setIntensity(3);
              setSelectedTriggers([]);
              setReflection('');
              setIsEditing(true);
              setJustSubmitted(false);
              onChanged?.();
            } catch (error: any) {
              Alert.alert(t.common.error, error.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formattedDate = dayjs()
    .locale(language === 'id' ? 'id' : 'en')
    .format('dddd, D MMMM YYYY');

  // View / Confirmation state when today's check-in exists and not editing
  if (existingEntry && !isEditing) {
    const moodMeta = MOOD_OPTIONS.find((m) => m.key === existingEntry.mood);
    const MoodIcon = moodMeta?.Icon ?? Frown;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.moodCheckIn.title}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>

        {justSubmitted && (
          <View style={styles.confirmationBanner}>
            <CheckCircle2 size={22} color={Colors.success} />
            <View style={styles.confirmationTextWrap}>
              <Text style={styles.confirmationTitle}>{t.moodCheckIn.savedTitle}</Text>
              <Text style={styles.confirmationMsg}>{t.moodCheckIn.confirmationMsg}</Text>
            </View>
          </View>
        )}

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIconBox, { backgroundColor: moodMeta?.bg ?? Colors.lavender }]}>
              <MoodIcon size={30} color={Colors.navy} />
            </View>
            <View style={styles.summaryTitleWrap}>
              <Text style={styles.summaryLabel}>{t.moodCheckIn.todayRecordedTitle}</Text>
              <Text style={styles.summaryMood}>
                {t.home.moods[existingEntry.mood]}
              </Text>
              <Text style={styles.summaryIntensity}>
                {t.home.intensity}: {existingEntry.intensity}/5 —{' '}
                {t.moodCheckIn.intensityLabels[existingEntry.intensity as 1 | 2 | 3 | 4 | 5]}
              </Text>
            </View>
          </View>

          {existingEntry.triggers.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionLabel}>{t.moodCheckIn.step3Title}</Text>
              <View style={styles.chipWrap}>
                {existingEntry.triggers.map((tr) => (
                  <View key={tr} style={styles.chipReadonly}>
                    <Text style={styles.chipReadonlyText}>
                      {t.moodCheckIn.triggers[tr as keyof typeof t.moodCheckIn.triggers] ?? tr}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {existingEntry.reflection ? (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionLabel}>{t.moodCheckIn.step4Title}</Text>
              <Text style={styles.reflectionReadonly}>{existingEntry.reflection}</Text>
            </View>
          ) : null}

          <View style={styles.summaryActions}>
            <TouchableOpacity
              style={styles.editActionBtn}
              onPress={() => {
                setIsEditing(true);
                setJustSubmitted(false);
              }}
            >
              <Pencil size={16} color={Colors.primary} />
              <Text style={styles.editActionText}>{t.moodCheckIn.editCheckIn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteActionBtn}
              onPress={handleDelete}
              disabled={saving}
            >
              <Trash2 size={16} color={Colors.danger} />
              <Text style={styles.deleteActionText}>{t.moodCheckIn.deleteCheckIn}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {justSubmitted && (
          <Button
            title={t.moodCheckIn.backToHome}
            variant="outline"
            onPress={() => router.push('/(app)/(tabs)/home')}
          />
        )}
      </ScrollView>
    );
  }

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
        <View style={styles.header}>
          <Illustration name="moodCheckin" width={170} height={115} />
          <Text style={styles.title}>{t.moodCheckIn.title}</Text>
          <Text style={styles.subtitle}>{t.moodCheckIn.subtitle}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Step 1: Mood Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.stepTitle}>{t.moodCheckIn.step1Title}</Text>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map(({ key, Icon, bg }) => {
              const selected = selectedMood === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.moodTile,
                    { backgroundColor: selected ? Colors.lavender : Colors.warmwhite },
                    selected && styles.moodTileSelected,
                  ]}
                  onPress={() => setSelectedMood(key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.moodIconCircle, { backgroundColor: bg }]}>
                    <Icon size={22} color={Colors.navy} />
                  </View>
                  <Text
                    style={[styles.moodTileText, selected && styles.moodTileTextSelected]}
                    numberOfLines={2}
                  >
                    {t.home.moods[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Step 2: Emotional Intensity */}
        <Card style={styles.sectionCard}>
          <Text style={styles.stepTitle}>{t.moodCheckIn.step2Title}</Text>
          <View style={styles.intensityRow}>
            {([1, 2, 3, 4, 5] as const).map((score) => {
              const active = intensity === score;
              return (
                <TouchableOpacity
                  key={score}
                  style={[styles.intensityBtn, active && styles.intensityBtnActive]}
                  onPress={() => setIntensity(score)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.intensityNum, active && styles.intensityNumActive]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.intensityCaption}>
            {t.moodCheckIn.intensityLabels[intensity as 1 | 2 | 3 | 4 | 5]}
          </Text>
        </Card>

        {/* Step 3: Emotional Triggers */}
        <Card style={styles.sectionCard}>
          <Text style={styles.stepTitle}>{t.moodCheckIn.step3Title}</Text>
          <View style={styles.chipWrap}>
            {TRIGGER_KEYS.map((key) => {
              const selected = selectedTriggers.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleTrigger(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t.moodCheckIn.triggers[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Step 4: Optional Reflection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.stepTitle}>{t.moodCheckIn.step4Title}</Text>
          <Text style={styles.reflectionPrompt}>{t.moodCheckIn.reflectionPrompt}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t.moodCheckIn.reflectionPlaceholder}
            placeholderTextColor={Colors.muted}
            value={reflection}
            onChangeText={setReflection}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <View style={styles.submitActions}>
          <Button
            title={existingEntry ? t.moodCheckIn.updateBtn : t.moodCheckIn.saveBtn}
            onPress={handleSave}
            loading={saving}
          />
          {existingEntry && (
            <Button
              title={t.common.cancel}
              variant="ghost"
              onPress={() => {
                setSelectedMood(existingEntry.mood);
                setIntensity(existingEntry.intensity);
                setSelectedTriggers(existingEntry.triggers);
                setReflection(existingEntry.reflection ?? '');
                setIsEditing(false);
              }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.warmwhite },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite },
  container: { flex: 1, backgroundColor: Colors.warmwhite },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginTop: Spacing.xs },
  subtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  dateText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', marginTop: 6, textTransform: 'capitalize' },
  sectionCard: { marginBottom: Spacing.md },
  stepTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy, marginBottom: Spacing.sm },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodTile: {
    width: '22.5%',
    minWidth: 72,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moodTileSelected: { borderColor: Colors.primary },
  moodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moodTileText: { fontSize: 11, color: Colors.navy, textAlign: 'center', fontWeight: '500' },
  moodTileTextSelected: { color: Colors.primary, fontWeight: '700' },
  intensityRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  intensityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.warmwhite,
    alignItems: 'center',
  },
  intensityBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  intensityNum: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  intensityNumActive: { color: Colors.white },
  intensityCaption: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: Colors.warmwhite,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lavender,
  },
  chipText: { fontSize: FontSize.xs, color: Colors.navy, fontWeight: '500' },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  reflectionPrompt: { fontSize: FontSize.sm, color: Colors.muted, marginBottom: Spacing.sm },
  textArea: {
    backgroundColor: Colors.warmwhite,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    minHeight: 100,
    fontSize: FontSize.sm,
    color: Colors.navy,
  },
  submitActions: { gap: Spacing.xs, marginTop: Spacing.xs },
  confirmationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  confirmationTextWrap: { flex: 1 },
  confirmationTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.navy, marginBottom: 4 },
  confirmationMsg: { fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
  summaryCard: { marginTop: Spacing.sm, marginBottom: Spacing.md },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  summaryIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleWrap: { flex: 1 },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '600' },
  summaryMood: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy, marginTop: 2 },
  summaryIntensity: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  summarySection: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  summarySectionLabel: { fontSize: FontSize.xs, color: Colors.muted, fontWeight: '700', marginBottom: 8 },
  chipReadonly: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.lavender,
  },
  chipReadonlyText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  reflectionReadonly: { fontSize: FontSize.sm, color: Colors.navy, lineHeight: 20 },
  summaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.lavender,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  editActionText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  deleteActionText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.sm },
});
