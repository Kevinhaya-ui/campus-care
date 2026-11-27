import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  BarChart3,
  BookOpen,
  Bot,
  Compass,
  Lightbulb,
  Smile,
  Sparkles,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Card } from '../../components/ui/Card';
import { Illustration } from '../../components/ui/Illustration';
import { FadeInView, ScalePressable } from '../../components/ui/AnimatedPrimitives';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { filterCardsByLanguage, MotivationalCardRow } from '../../constants/starterCards';

interface TodayMood {
  mood: string;
  intensity: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const { t, language } = useTranslation();
  const [todayMood, setTodayMood] = useState<TodayMood | null>(null);
  const [dailyCard, setDailyCard] = useState<MotivationalCardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return t.home.greetingMorning;
    if (hour < 17) return t.home.greetingAfternoon;
    return t.home.greetingEvening;
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? t.home.defaultName;

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood, intensity')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();
      setTodayMood(moodData ?? null);

      const { data: cards } = await supabase
        .from('motivational_cards')
        .select('*')
        .eq('published', true);
      if (cards && cards.length > 0) {
        const localized = filterCardsByLanguage(cards as MotivationalCardRow[], language);
        const dayOfYear = dayjs().diff(dayjs().startOf('year'), 'day');
        setDailyCard(localized[dayOfYear % localized.length]);
      }
    } catch (_) {
      // Silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, language]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const moodDisplay = todayMood
    ? (t.home.moods[todayMood.mood as keyof typeof t.home.moods] ?? todayMood.mood)
    : '';

  const quickItems = [
    { Icon: BookOpen, label: t.home.journal, route: '/(app)/(tabs)/journal', bg: Colors.mint },
    { Icon: Bot, label: t.home.aiCompanion, route: '/(app)/ai-chat', bg: Colors.lavender },
    { Icon: BarChart3, label: t.home.moodHistory, route: '/(app)/(tabs)/mood?tab=history', bg: Colors.skyblue },
    { Icon: Compass, label: t.home.discover, route: '/(app)/(tabs)/discover', bg: Colors.peach },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Greeting */}
      <FadeInView delay={0}>
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{greeting()},</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </FadeInView>

      {/* Today's Mood Check-In */}
      <FadeInView delay={70}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t.home.howFeelingToday}</Text>
          </View>
          {todayMood ? (
            <View style={styles.moodDone}>
              <View style={styles.moodIconBadge}>
                <Smile size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.moodLabel}>{moodDisplay}</Text>
                <Text style={styles.moodIntensity}>
                  {t.home.intensity}: {todayMood.intensity}/5
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push('/(app)/(tabs)/mood')}
              >
                <Text style={styles.editBtnText}>{t.common.edit}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.illustrationCenter}>
                <Illustration name="moodCheckin" width={170} height={115} />
              </View>
              <Text style={styles.moodPrompt}>{t.home.checkInPrompt}</Text>
              <ScalePressable onPress={() => router.push('/(app)/(tabs)/mood')}>
                <View style={styles.checkInBtn}>
                  <Text style={styles.checkInBtnText}>{t.home.checkInNow}</Text>
                </View>
              </ScalePressable>
            </View>
          )}
        </Card>
      </FadeInView>

      {/* Daily Motivational Card */}
      {dailyCard && (
        <FadeInView delay={140}>
          <Card style={[styles.card, styles.motivationCard]}>
            <View style={styles.badgeRow}>
              <Sparkles size={14} color={Colors.primary} />
              <Text style={styles.categoryBadge}>{dailyCard.category}</Text>
            </View>
            <Text style={styles.motivationText}>"{dailyCard.front_content}"</Text>
            {dailyCard.back_content && (
              <Text style={styles.motivationSub}>{dailyCard.back_content}</Text>
            )}
          </Card>
        </FadeInView>
      )}

      {/* Quick Access */}
      <FadeInView delay={210}>
        <Text style={styles.sectionTitle}>{t.home.quickAccess}</Text>
        <View style={styles.quickGrid}>
          {quickItems.map(({ Icon, label, route, bg }) => (
            <ScalePressable
              key={label}
              style={styles.quickItemWrap}
              onPress={() => router.push(route as any)}
            >
              <View style={styles.quickItem}>
                <View style={[styles.quickIconBox, { backgroundColor: bg }]}>
                  <Icon size={22} color={Colors.navy} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </View>
            </ScalePressable>
          ))}
        </View>
      </FadeInView>

      {/* Wellness Tip */}
      <FadeInView delay={280}>
        <View style={styles.tipBox}>
          <View style={styles.tipHeader}>
            <Lightbulb size={16} color={Colors.navy} />
            <Text style={styles.tipTitle}>{t.home.rememberTitle}</Text>
          </View>
          <Text style={styles.tipText}>{t.home.rememberText}</Text>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite },
  container: { flex: 1, backgroundColor: Colors.warmwhite },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  greetingSection: { marginBottom: Spacing.lg },
  greetingText: { fontSize: FontSize.lg, color: Colors.muted },
  greetingName: { fontSize: FontSize['3xl'], fontWeight: '700', color: Colors.navy },
  dateText: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 4, textTransform: 'capitalize' },
  card: { marginBottom: Spacing.md },
  cardHeader: { marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  illustrationCenter: { alignItems: 'center', marginBottom: Spacing.sm },
  moodDone: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  moodIconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.navy },
  moodIntensity: { fontSize: FontSize.xs, color: Colors.muted },
  editBtn: { marginLeft: 'auto', backgroundColor: Colors.lavender, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  editBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  moodPrompt: { fontSize: FontSize.sm, color: Colors.muted, lineHeight: 20, marginBottom: Spacing.md, textAlign: 'center' },
  checkInBtn: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  checkInBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
  motivationCard: { backgroundColor: Colors.lavender, borderWidth: 0 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  motivationText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.navy, lineHeight: 24, marginBottom: 8 },
  motivationSub: { fontSize: FontSize.sm, color: '#4A5568', lineHeight: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginBottom: Spacing.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickItemWrap: { flex: 1, minWidth: '45%' },
  quickItem: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.navy },
  tipBox: { backgroundColor: Colors.skyblue, borderRadius: Radius.md, padding: Spacing.md },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.navy },
  tipText: { fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
});
