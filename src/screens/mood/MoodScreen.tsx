import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import MoodCheckInScreen from './MoodCheckInScreen';
import { MoodHistoryView } from './MoodHistoryView';
import { MoodAnalyticsView } from './MoodAnalyticsView';
import { MoodEntryRow, MoodKey } from './moodMeta';
import { FadeInView } from '../../components/ui/AnimatedPrimitives';

type MoodTabKey = 'checkin' | 'history' | 'analytics';

export default function MoodScreen() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<MoodTabKey>('checkin');
  const [entries, setEntries] = useState<MoodEntryRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.tab === 'history' || params.tab === 'analytics' || params.tab === 'checkin') {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const fetchAllMoods = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('id, mood, intensity, triggers, reflection, entry_date')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(
        (data ?? []).map((d) => ({
          id: d.id,
          mood: d.mood as MoodKey,
          intensity: d.intensity,
          triggers: Array.isArray(d.triggers) ? d.triggers : [],
          reflection: d.reflection ?? null,
          entry_date: d.entry_date,
        }))
      );
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setRefreshing(false);
    }
  }, [user, t.common.error]);

  useFocusEffect(
    useCallback(() => {
      fetchAllMoods();
    }, [fetchAllMoods])
  );

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchAllMoods();
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Segmented Control */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentBar}>
          {(
            [
              { key: 'checkin', label: t.moodAnalytics.tabCheckIn },
              { key: 'history', label: t.moodAnalytics.tabHistory },
              { key: 'analytics', label: t.moodAnalytics.tabAnalytics },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'checkin' ? (
        <FadeInView key="checkin" style={styles.tabBody} offsetY={8} duration={240}>
          <MoodCheckInScreen onChanged={fetchAllMoods} />
        </FadeInView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAllMoods();
              }}
              tintColor={Colors.primary}
            />
          }
        >
          <FadeInView key={activeTab} offsetY={8} duration={240}>
            {activeTab === 'history' ? (
              <MoodHistoryView
                entries={entries}
                onDeleteEntry={handleDeleteEntry}
                onGoToCheckIn={() => setActiveTab('checkin')}
              />
            ) : (
              <MoodAnalyticsView
                entries={entries}
                onGoToCheckIn={() => setActiveTab('checkin')}
              />
            )}
          </FadeInView>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmwhite },
  segmentWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: Colors.lavender,
    borderRadius: Radius.md,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.navy },
  segmentTextActive: { color: Colors.primary, fontWeight: '700' },
  tabBody: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
});
