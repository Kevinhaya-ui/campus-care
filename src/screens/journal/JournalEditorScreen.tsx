import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Shuffle, Sparkles, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { MOOD_OPTIONS } from '../mood/moodMeta';
import { JOURNAL_TAG_KEYS } from './journalMeta';

export default function JournalEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; prompt?: string }>();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isEdit = Boolean(params.id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(params.prompt ? `${params.prompt}\n\n` : '');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promptIdx, setPromptIdx] = useState(0);

  const [initialSnapshot, setInitialSnapshot] = useState({
    title: '',
    content: params.prompt ? `${params.prompt}\n\n` : '',
    mood: null as string | null,
    tags: [] as string[],
  });

  useEffect(() => {
    if (!params.id || !user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('id, title, content, mood, tags')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        const loadedTags = Array.isArray(data.tags) ? data.tags : [];
        setTitle(data.title ?? '');
        setContent(data.content ?? '');
        setSelectedMood(data.mood ?? null);
        setSelectedTags(loadedTags);
        setInitialSnapshot({
          title: data.title ?? '',
          content: data.content ?? '',
          mood: data.mood ?? null,
          tags: loadedTags,
        });
      } catch (error: any) {
        Alert.alert(t.common.error, error.message);
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, user]);

  const hasChanges =
    title !== initialSnapshot.title ||
    content !== initialSnapshot.content ||
    selectedMood !== initialSnapshot.mood ||
    JSON.stringify(selectedTags) !== JSON.stringify(initialSnapshot.tags);

  const handleBack = () => {
    if (!hasChanges) {
      router.back();
      return;
    }
    Alert.alert(t.journal.discardTitle, t.journal.discardMsg, [
      { text: t.journal.keepEditing, style: 'cancel' },
      { text: t.journal.discardAction, style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const shufflePrompt = () => {
    setPromptIdx((prev) => (prev + 1) % t.journal.prompts.length);
  };

  const applyPrompt = () => {
    const promptText = t.journal.prompts[promptIdx];
    setContent((prev) => (prev.trim() ? `${prev}\n\n${promptText}\n` : `${promptText}\n\n`));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!content.trim()) {
      Alert.alert(t.journal.contentRequiredTitle, t.journal.contentRequiredMsg);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim() || null,
        content: content.trim(),
        mood: selectedMood,
        tags: selectedTags,
      };

      if (isEdit && params.id) {
        const { error } = await supabase
          .from('journal_entries')
          .update(payload)
          .eq('id', params.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('journal_entries').insert({
          ...payload,
          user_id: user.id,
        });
        if (error) throw error;
      }

      router.back();
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!params.id || !user) return;
    Alert.alert(t.journal.deleteConfirmTitle, t.journal.deleteConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.journal.deleteAction,
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            const { error } = await supabase
              .from('journal_entries')
              .delete()
              .eq('id', params.id)
              .eq('user_id', user.id);
            if (error) throw error;
            router.back();
          } catch (error: any) {
            Alert.alert(t.common.error, error.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={20} color={Colors.navy} />
            <Text style={styles.backText}>{t.common.back}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? t.journal.editorEditTitle : t.journal.editorNewTitle}
          </Text>
          {isEdit ? (
            <TouchableOpacity onPress={handleDelete} hitSlop={8} disabled={saving}>
              <Trash2 size={20} color={Colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 20 }} />
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Interactive Guided Prompt Card */}
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <View style={styles.promptBadge}>
                <Sparkles size={13} color={Colors.primary} />
                <Text style={styles.promptBadgeText}>{t.journal.promptBannerLabel}</Text>
              </View>
              <View style={styles.promptActions}>
                <TouchableOpacity style={styles.promptActionBtn} onPress={shufflePrompt}>
                  <Shuffle size={13} color={Colors.primary} />
                  <Text style={styles.promptActionText}>{t.journal.shufflePrompt}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.usePromptBtn} onPress={applyPrompt}>
                  <Text style={styles.usePromptText}>{t.journal.usePrompt}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.promptText}>{t.journal.prompts[promptIdx]}</Text>
          </View>

          {/* Associated Mood Strip */}
          <Text style={styles.sectionLabel}>{t.journal.moodLabel}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScroll}
          >
            {MOOD_OPTIONS.map(({ key, Icon, bg }) => {
              const active = selectedMood === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.moodChip, active && { backgroundColor: bg, borderColor: Colors.primary }]}
                  onPress={() => setSelectedMood(active ? null : key)}
                  activeOpacity={0.8}
                >
                  <Icon size={16} color={Colors.navy} />
                  <Text style={[styles.moodChipText, active && styles.moodChipTextActive]}>
                    {t.home.moods[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Writing Paper Canvas */}
          <View style={styles.paperCard}>
            <TextInput
              style={styles.titleInput}
              placeholder={t.journal.titlePlaceholder}
              placeholderTextColor={Colors.muted}
              value={title}
              onChangeText={setTitle}
            />
            <View style={styles.paperDivider} />
            <TextInput
              style={styles.contentInput}
              placeholder={t.journal.contentPlaceholder}
              placeholderTextColor={Colors.muted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.wordBadge}>
              {t.journal.wordsCount.replace('{count}', String(wordCount))}
            </Text>
          </View>

          {/* Tags */}
          <Text style={styles.sectionLabel}>{t.journal.tagsLabel}</Text>
          <View style={styles.tagsWrap}>
            {JOURNAL_TAG_KEYS.map((key) => {
              const active = selectedTags.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => toggleTag(key)}
                >
                  <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                    {t.journal.tags[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title={isEdit ? t.journal.updateEntry : t.journal.saveEntry}
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
  flex: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F5',
    backgroundColor: Colors.warmwhite,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: FontSize.sm, color: Colors.navy, fontWeight: '600' },
  headerTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  promptCard: {
    backgroundColor: Colors.lavender,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promptBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  promptActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promptActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
  },
  promptActionText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  usePromptBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  usePromptText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  promptText: { fontSize: FontSize.sm, color: Colors.navy, fontWeight: '600', lineHeight: 20 },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.muted, marginBottom: 8 },
  moodScroll: { gap: 8, paddingBottom: Spacing.md },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moodChipText: { fontSize: FontSize.xs, color: Colors.navy, fontWeight: '500' },
  moodChipTextActive: { fontWeight: '700' },
  paperCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    marginBottom: Spacing.md,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  titleInput: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.navy,
    paddingVertical: 6,
  },
  paperDivider: { height: 1, backgroundColor: '#F0F2F5', marginVertical: 8 },
  contentInput: {
    minHeight: 190,
    fontSize: FontSize.base,
    color: Colors.navy,
    lineHeight: 24,
  },
  wordBadge: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 8,
    fontWeight: '600',
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  tagChipActive: { backgroundColor: Colors.lavender, borderColor: Colors.primary },
  tagChipText: { fontSize: FontSize.xs, color: Colors.navy, fontWeight: '500' },
  tagChipTextActive: { color: Colors.primary, fontWeight: '700' },
});
