import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Lock,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { FadeInView, ScalePressable } from '../../components/ui/AnimatedPrimitives';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { getMoodMeta } from '../mood/moodMeta';
import { JOURNAL_TAG_KEYS, JournalEntryRow } from './journalMeta';

type DateFilter = 'all' | 'week' | 'month';

export default function JournalListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  const [entries, setEntries] = useState<JournalEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, user_id, title, content, mood, tags, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(
        (data ?? []).map((d) => ({
          ...d,
          tags: Array.isArray(d.tags) ? d.tags : [],
        }))
      );
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, t.common.error]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries])
  );

  const thisWeekCount = useMemo(() => {
    const cutoff = dayjs().subtract(6, 'day').startOf('day');
    return entries.filter((e) => dayjs(e.created_at).isAfter(cutoff)).length;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const weekCutoff = dayjs().subtract(6, 'day').startOf('day');
    const monthCutoff = dayjs().subtract(29, 'day').startOf('day');

    return entries.filter((entry) => {
      if (dateFilter === 'week' && !dayjs(entry.created_at).isAfter(weekCutoff)) {
        return false;
      }
      if (dateFilter === 'month' && !dayjs(entry.created_at).isAfter(monthCutoff)) {
        return false;
      }
      if (selectedTag !== 'all' && !entry.tags.includes(selectedTag)) {
        return false;
      }
      if (q) {
        const hay = `${entry.title ?? ''} ${entry.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, searchQuery, selectedTag, dateFilter]);

  const openNewEditor = (promptText?: string) => {
    router.push({
      pathname: '/(app)/journal-editor' as any,
      params: promptText ? { prompt: promptText } : undefined,
    });
  };

  const openEditEditor = (id: string) => {
    router.push({
      pathname: '/(app)/journal-editor' as any,
      params: { id },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchEntries();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <Text style={styles.title}>{t.journal.title}</Text>

        {/* Privacy Banner */}
        <View style={styles.privacyBanner}>
          <Lock size={14} color={Colors.primary} />
          <Text style={styles.privacyText}>{t.journal.privacyBadge}</Text>
        </View>

        {/* Stats Strip */}
        {entries.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: Colors.lavender }]}>
              <Text style={styles.statNum}>{entries.length}</Text>
              <Text style={styles.statLabel}>{t.journal.totalEntries}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.mint }]}>
              <Text style={styles.statNum}>{thisWeekCount}</Text>
              <Text style={styles.statLabel}>{t.journal.thisWeek}</Text>
            </View>
          </View>
        )}

        {/* Search & Filters */}
        {entries.length > 0 && (
          <>
            <View style={styles.searchBox}>
              <Search size={18} color={Colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t.journal.searchPlaceholder}
                placeholderTextColor={Colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={18} color={Colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Date Filter */}
            <View style={styles.dateFilterRow}>
              {(
                [
                  { key: 'all', label: t.journal.periodAll },
                  { key: 'week', label: t.journal.periodWeek },
                  { key: 'month', label: t.journal.periodMonth },
                ] as const
              ).map((item) => {
                const active = dateFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    onPress={() => setDateFilter(item.key)}
                  >
                    <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tag Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagScroll}
            >
              <TouchableOpacity
                style={[styles.tagChip, selectedTag === 'all' && styles.tagChipActive]}
                onPress={() => setSelectedTag('all')}
              >
                <Text style={[styles.tagChipText, selectedTag === 'all' && styles.tagChipTextActive]}>
                  {t.journal.allTags}
                </Text>
              </TouchableOpacity>
              {JOURNAL_TAG_KEYS.map((key) => {
                const active = selectedTag === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => setSelectedTag(key)}
                  >
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                      {t.journal.tags[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Empty State or Entry List */}
        {entries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Illustration name="challenges" width={190} height={135} />
            <Text style={styles.emptyTitle}>{t.journal.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{t.journal.emptySubtitle}</Text>

            <View style={styles.starterPrompts}>
              {t.journal.prompts.slice(0, 2).map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.starterPromptBtn}
                  onPress={() => openNewEditor(p)}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color={Colors.primary} />
                  <Text style={styles.starterPromptText} numberOfLines={2}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={t.journal.newEntry}
              onPress={() => openNewEditor()}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card style={styles.noResultCard}>
            <Text style={styles.noResultText}>{t.journal.noSearchResults}</Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {filteredEntries.map((entry, idx) => {
              const moodMeta = entry.mood ? getMoodMeta(entry.mood) : null;
              const MoodIcon = moodMeta?.Icon;
              const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
              const dateLabel = dayjs(entry.created_at)
                .locale(language === 'id' ? 'id' : 'en')
                .format('ddd, D MMM YYYY · HH:mm');

              return (
                <FadeInView key={entry.id} delay={Math.min(idx * 50, 250)} offsetY={10}>
                  <ScalePressable onPress={() => openEditEditor(entry.id)} scaleTo={0.985}>
                    <Card
                      style={[
                        styles.entryCard,
                        { borderLeftColor: moodMeta?.accent ?? Colors.primary },
                      ]}
                    >
                      <View style={styles.entryTopRow}>
                        <Text style={styles.entryDate}>{dateLabel}</Text>
                        {MoodIcon && (
                          <View style={[styles.moodPill, { backgroundColor: moodMeta?.bg }]}>
                            <MoodIcon size={13} color={Colors.navy} />
                            <Text style={styles.moodPillText}>
                              {t.home.moods[entry.mood as keyof typeof t.home.moods] ?? entry.mood}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {entry.title?.trim() ? entry.title : t.journal.untitled}
                      </Text>
                      <Text style={styles.entryPreview} numberOfLines={3}>
                        {entry.content}
                      </Text>

                      <View style={styles.entryFooter}>
                        <View style={styles.entryTagsRow}>
                          {entry.tags.slice(0, 3).map((tag) => (
                            <View key={tag} style={styles.entryTag}>
                              <Text style={styles.entryTagText}>
                                {t.journal.tags[tag as keyof typeof t.journal.tags] ?? tag}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.wordCount}>
                          {t.journal.wordsCount.replace('{count}', String(wordCount))}
                        </Text>
                      </View>
                    </Card>
                  </ScalePressable>
                </FadeInView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openNewEditor()}
        activeOpacity={0.85}
      >
        <Plus size={26} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmwhite },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy, marginBottom: Spacing.sm },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lavender,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  privacyText: { flex: 1, fontSize: FontSize.xs, color: Colors.navy, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statBox: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statNum: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy },
  statLabel: { fontSize: FontSize.xs, color: Colors.navy, fontWeight: '600', marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.navy },
  dateFilterRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  dateChipText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.navy },
  dateChipTextActive: { color: Colors.white },
  tagScroll: { gap: 8, paddingBottom: Spacing.md },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagChipText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.navy },
  tagChipTextActive: { color: Colors.white },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  starterPrompts: { width: '100%', gap: 8, marginTop: Spacing.md },
  starterPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lavender,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  starterPromptText: { flex: 1, fontSize: FontSize.xs, color: Colors.navy, fontWeight: '600', lineHeight: 18 },
  noResultCard: { alignItems: 'center', padding: Spacing.xl },
  noResultText: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center' },
  list: { gap: Spacing.sm },
  entryCard: { borderLeftWidth: 4 },
  entryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  entryDate: { fontSize: 11, color: Colors.muted, fontWeight: '600', textTransform: 'capitalize' },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  moodPillText: { fontSize: 11, fontWeight: '600', color: Colors.navy },
  entryTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy, marginBottom: 4 },
  entryPreview: { fontSize: FontSize.sm, color: '#4A5568', lineHeight: 20 },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F3F5F8',
  },
  entryTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  entryTag: { backgroundColor: Colors.lavender, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  entryTagText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  wordCount: { fontSize: 11, color: Colors.muted, fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
