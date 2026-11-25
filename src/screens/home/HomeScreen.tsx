import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const MOOD_EMOJIS: Record<string, string> = {
  'Very Happy': '😄',
  Happy: '😊',
  Neutral: '😐',
  Sad: '😢',
  Anxious: '😰',
  Stressed: '😤',
  Angry: '😠',
  Exhausted: '😴',
};

interface TodayMood {
  mood: string;
  intensity: number;
}

interface DailyCard {
  front_content: string;
  category: string;
  back_content: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const [todayMood, setTodayMood] = useState<TodayMood | null>(null);
  const [dailyCard, setDailyCard] = useState<DailyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const loadData = async () => {
    if (!user) return;
    try {
      // Today's mood
      const today = dayjs().format('YYYY-MM-DD');
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood, intensity')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .single();
      setTodayMood(moodData ?? null);

      // Daily motivational card (pseudo-random by day of year)
      const { data: cards } = await supabase
        .from('motivational_cards')
        .select('front_content, category, back_content')
        .eq('published', true);
      if (cards && cards.length > 0) {
        const dayOfYear = dayjs().diff(dayjs().startOf('year'), 'day');
        setDailyCard(cards[dayOfYear % cards.length]);
      }
    } catch (_) {
      // Silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>{greeting()},</Text>
        <Text style={styles.greetingName}>{firstName} 👋</Text>
        <Text style={styles.dateText}>{dayjs().format('dddd, D MMMM YYYY')}</Text>
      </View>

      {/* Today's Mood Check-In */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>How are you feeling today?</Text>
        </View>
        {todayMood ? (
          <View style={styles.moodDone}>
            <Text style={styles.moodEmoji}>{MOOD_EMOJIS[todayMood.mood] ?? '😊'}</Text>
            <View>
              <Text style={styles.moodLabel}>{todayMood.mood}</Text>
              <Text style={styles.moodIntensity}>Intensity: {todayMood.intensity}/5</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(app)/(tabs)/mood')}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.moodPrompt}>
              Take 30 seconds to check in with yourself. Understanding your feelings is a meaningful step. 🌱
            </Text>
            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={() => router.push('/(app)/(tabs)/mood')}
              activeOpacity={0.85}
            >
              <Text style={styles.checkInBtnText}>Check In Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Daily Motivational Card */}
      {dailyCard && (
        <Card style={[styles.card, styles.motivationCard]}>
          <Text style={styles.categoryBadge}>{dailyCard.category}</Text>
          <Text style={styles.motivationText}>"{dailyCard.front_content}"</Text>
          {dailyCard.back_content && (
            <Text style={styles.motivationSub}>{dailyCard.back_content}</Text>
          )}
        </Card>
      )}

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickGrid}>
        {[
          { emoji: '📔', label: 'Journal', route: '/(app)/(tabs)/journal' },
          { emoji: '🤖', label: 'AI Companion', route: '/(app)/ai-chat' },
          { emoji: '📊', label: 'Mood History', route: '/(app)/(tabs)/mood' },
          { emoji: '✨', label: 'Discover', route: '/(app)/(tabs)/discover' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickEmoji}>{item.emoji}</Text>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wellness Tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 Remember</Text>
        <Text style={styles.tipText}>
          CampusCare is a wellness companion, not a replacement for professional care.
          If you're struggling, please reach out to a qualified professional. 💙
        </Text>
      </View>
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
  dateText: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 4 },
  card: { marginBottom: Spacing.md },
  cardHeader: { marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  moodDone: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  moodEmoji: { fontSize: 36 },
  moodLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.navy },
  moodIntensity: { fontSize: FontSize.xs, color: Colors.muted },
  editBtn: { marginLeft: 'auto', backgroundColor: Colors.lavender, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  editBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  moodPrompt: { fontSize: FontSize.sm, color: Colors.muted, lineHeight: 20, marginBottom: Spacing.md },
  checkInBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  checkInBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
  motivationCard: { backgroundColor: Colors.lavender, borderWidth: 0 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  motivationText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.navy, lineHeight: 24, marginBottom: 8 },
  motivationSub: { fontSize: FontSize.sm, color: '#4A5568', lineHeight: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginBottom: Spacing.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickEmoji: { fontSize: 28 },
  quickLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.navy },
  tipBox: { backgroundColor: Colors.skyblue, borderRadius: Radius.md, padding: Spacing.md },
  tipTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.navy, marginBottom: 6 },
  tipText: { fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
});
