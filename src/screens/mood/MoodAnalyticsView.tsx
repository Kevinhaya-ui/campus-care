import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Sparkles } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { useTranslation } from '../../i18n/useTranslation';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { getMoodMeta, MoodEntryRow } from './moodMeta';
import {
  HorizontalStatBars,
  MonthlyMoodCalendar,
  WeeklyIntensityLineChart,
} from './MoodCharts';

interface MoodAnalyticsViewProps {
  entries: MoodEntryRow[];
  onGoToCheckIn: () => void;
}

export function MoodAnalyticsView({ entries, onGoToCheckIn }: MoodAnalyticsViewProps) {
  const { t, language } = useTranslation();
  const [monthDate, setMonthDate] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    dayjs().format('YYYY-MM-DD')
  );

  const stats = useMemo(() => {
    const cutoff7 = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    const cutoff30 = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
    const monthPrefix = monthDate.format('YYYY-MM');

    const last7 = entries.filter((e) => e.entry_date >= cutoff7);
    const last30 = entries.filter((e) => e.entry_date >= cutoff30);
    const thisMonth = entries.filter((e) => e.entry_date.startsWith(monthPrefix));

    // Mood distribution for selected month
    const moodCounts = new Map<string, number>();
    thisMonth.forEach((e) => {
      moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1);
    });
    const moodBars = Array.from(moodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([mood, count]) => ({
        label: t.home.moods[mood as keyof typeof t.home.moods] ?? mood,
        count,
        color: getMoodMeta(mood).accent,
      }));

    // Top triggers in last 30 days
    const triggerCounts = new Map<string, number>();
    last30.forEach((e) => {
      e.triggers.forEach((tr) => {
        triggerCounts.set(tr, (triggerCounts.get(tr) ?? 0) + 1);
      });
    });
    const triggerBars = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tr, count]) => ({
        label: t.moodCheckIn.triggers[tr as keyof typeof t.moodCheckIn.triggers] ?? tr,
        count,
        color: Colors.primary,
      }));

    // Weekly top mood for non-diagnostic insight
    const weekMoodCounts = new Map<string, number>();
    last7.forEach((e) => {
      weekMoodCounts.set(e.mood, (weekMoodCounts.get(e.mood) ?? 0) + 1);
    });
    const topWeekMood = Array.from(weekMoodCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      last7Count: last7.length,
      last30Count: last30.length,
      moodBars,
      triggerBars,
      topWeekMood,
      topTrigger: triggerBars[0] ?? null,
    };
  }, [entries, monthDate, t]);

  if (entries.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Illustration name="goals" width={180} height={125} />
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

  const selectedEntry = selectedDate
    ? entries.find((e) => e.entry_date === selectedDate) ?? null
    : null;

  return (
    <View style={styles.wrap}>
      {/* Non-diagnostic Pattern Insights */}
      <Card style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Sparkles size={16} color={Colors.primary} />
          <Text style={styles.insightTitle}>{t.moodAnalytics.insightsTitle}</Text>
        </View>
        <Text style={styles.insightBullet}>
          • {t.moodAnalytics.insightTotalDays.replace('{count}', String(stats.last30Count))}
        </Text>
        {stats.topWeekMood && (
          <Text style={styles.insightBullet}>
            •{' '}
            {t.moodAnalytics.insightTopMood
              .replace(
                '{mood}',
                t.home.moods[stats.topWeekMood[0] as keyof typeof t.home.moods] ?? stats.topWeekMood[0]
              )
              .replace('{count}', String(stats.topWeekMood[1]))}
          </Text>
        )}
        {stats.topTrigger && (
          <Text style={styles.insightBullet}>
            • {t.moodAnalytics.insightTopTrigger.replace('{trigger}', stats.topTrigger.label)}
          </Text>
        )}
      </Card>

      {/* 1. Weekly Intensity Trend */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{t.moodAnalytics.weeklyTrendTitle}</Text>
        {stats.last7Count >= 2 ? (
          <WeeklyIntensityLineChart entries={entries} language={language} />
        ) : (
          <Text style={styles.mutedNote}>{t.moodAnalytics.weeklyTrendEmpty}</Text>
        )}
      </Card>

      {/* 2. Monthly Mood Distribution */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{t.moodAnalytics.monthlyDistTitle}</Text>
        {stats.moodBars.length > 0 ? (
          <HorizontalStatBars items={stats.moodBars} />
        ) : (
          <Text style={styles.mutedNote}>{t.moodAnalytics.noEntryOnDate}</Text>
        )}
      </Card>

      {/* 3. Top Emotional Triggers */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{t.moodAnalytics.topTriggersTitle}</Text>
        {stats.triggerBars.length > 0 ? (
          <HorizontalStatBars items={stats.triggerBars} />
        ) : (
          <Text style={styles.mutedNote}>{t.moodAnalytics.noTriggersYet}</Text>
        )}
      </Card>

      {/* 4. Monthly Calendar View */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{t.moodAnalytics.calendarTitle}</Text>
        <Text style={styles.calHint}>{t.moodAnalytics.calendarHint}</Text>
        <MonthlyMoodCalendar
          entries={entries}
          monthDate={monthDate}
          selectedDate={selectedDate}
          language={language}
          onChangeMonth={setMonthDate}
          onSelectDate={setSelectedDate}
        />

        {selectedDate && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedDateLabel}>
              {dayjs(selectedDate)
                .locale(language === 'id' ? 'id' : 'en')
                .format('dddd, D MMMM YYYY')}
            </Text>
            {selectedEntry ? (
              <>
                <Text style={styles.selectedMoodText}>
                  {t.home.moods[selectedEntry.mood]} · {t.home.intensity} {selectedEntry.intensity}/5
                </Text>
                {selectedEntry.reflection ? (
                  <Text style={styles.selectedReflection}>{selectedEntry.reflection}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.mutedNote}>{t.moodAnalytics.noEntryOnDate}</Text>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  insightCard: { backgroundColor: Colors.lavender },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  insightTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  insightBullet: { fontSize: FontSize.xs, color: Colors.navy, lineHeight: 19, marginTop: 4 },
  card: {},
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy, marginBottom: Spacing.sm },
  calHint: { fontSize: FontSize.xs, color: Colors.muted, marginBottom: Spacing.sm },
  mutedNote: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 18 },
  selectedBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  selectedDateLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, textTransform: 'capitalize' },
  selectedMoodText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.navy, marginTop: 4 },
  selectedReflection: { fontSize: FontSize.xs, color: Colors.navy, marginTop: 4, lineHeight: 18 },
});
