import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Trash2 } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { useTranslation } from '../../i18n/useTranslation';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { getMoodMeta, MoodEntryRow } from './moodMeta';

type PeriodFilter = '7d' | '30d' | 'all';

interface MoodHistoryViewProps {
  entries: MoodEntryRow[];
  onDeleteEntry: (id: string) => Promise<void>;
  onGoToCheckIn: () => void;
}

export function MoodHistoryView({
  entries,
  onDeleteEntry,
  onGoToCheckIn,
}: MoodHistoryViewProps) {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<PeriodFilter>('30d');

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    const cutoff = dayjs().subtract(filter === '7d' ? 6 : 29, 'day').format('YYYY-MM-DD');
    return entries.filter((e) => e.entry_date >= cutoff);
  }, [entries, filter]);

  const confirmDelete = (id: string) => {
    Alert.alert(
      t.moodAnalytics.deleteEntryTitle,
      t.moodAnalytics.deleteEntryMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.moodCheckIn.deleteAction,
          style: 'destructive',
          onPress: () => onDeleteEntry(id),
        },
      ]
    );
  };

  if (entries.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Illustration name="moodCheckin" width={180} height={125} />
        <Text style={styles.emptyTitle}>{t.moodAnalytics.emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{t.moodAnalytics.emptySubtitle}</Text>
        <Button
          title={t.moodAnalytics.startCheckIn}
          onPress={onGoToCheckIn}
          style={{ marginTop: Spacing.md }}
        />
      </Card>
    );
  }

  return (
    <View>
      <View style={styles.filterRow}>
        {(
          [
            { key: '7d', label: t.moodAnalytics.last7Days },
            { key: '30d', label: t.moodAnalytics.last30Days },
            { key: 'all', label: t.moodAnalytics.allTime },
          ] as const
        ).map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.countText}>
          {t.moodAnalytics.entriesCount.replace('{count}', String(filtered.length))}
        </Text>
      </View>

      <View style={styles.list}>
        {filtered.map((entry) => {
          const meta = getMoodMeta(entry.mood);
          const Icon = meta.Icon;
          const dateLabel = dayjs(entry.entry_date)
            .locale(language === 'id' ? 'id' : 'en')
            .format('ddd, D MMM YYYY');

          return (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                  <Icon size={20} color={Colors.navy} />
                </View>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryMood}>{t.home.moods[entry.mood]}</Text>
                  <Text style={styles.entryDate}>
                    {dateLabel} · {t.home.intensity} {entry.intensity}/5
                  </Text>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(entry.id)} hitSlop={8}>
                  <Trash2 size={18} color={Colors.muted} />
                </TouchableOpacity>
              </View>

              {entry.triggers.length > 0 && (
                <View style={styles.triggerRow}>
                  {entry.triggers.map((tr) => (
                    <View key={tr} style={styles.triggerPill}>
                      <Text style={styles.triggerPillText}>
                        {t.moodCheckIn.triggers[tr as keyof typeof t.moodCheckIn.triggers] ?? tr}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {entry.reflection ? (
                <Text style={styles.reflectionText}>{entry.reflection}</Text>
              ) : null}
            </Card>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.navy },
  filterTextActive: { color: Colors.white },
  countText: { marginLeft: 'auto', fontSize: FontSize.xs, color: Colors.muted, fontWeight: '600' },
  list: { gap: Spacing.sm },
  entryCard: { padding: Spacing.md },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  entryMeta: { flex: 1 },
  entryMood: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  entryDate: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2, textTransform: 'capitalize' },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  triggerPill: { backgroundColor: Colors.lavender, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  triggerPillText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  reflectionText: { fontSize: FontSize.sm, color: Colors.navy, marginTop: Spacing.sm, lineHeight: 20 },
});
