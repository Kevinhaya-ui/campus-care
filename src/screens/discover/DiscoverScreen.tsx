import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Share,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCw,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import {
  filterCardsByLanguage,
  MotivationalCardRow,
} from '../../constants/starterCards';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

const CARD_PALETTES = [
  { frontBg: Colors.lavender, backBg: Colors.mint },
  { frontBg: Colors.skyblue, backBg: Colors.peach },
  { frontBg: Colors.mint, backBg: Colors.lavender },
  { frontBg: Colors.peach, backBg: Colors.skyblue },
];

export default function DiscoverScreen() {
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  const [cards, setCards] = useState<MotivationalCardRow[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Animations: 3D Flip + Horizontal Swipe/Slide
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const fetchCardsAndSaved = useCallback(async () => {
    try {
      const { data: cardsData, error: cardsErr } = await supabase
        .from('motivational_cards')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: true });

      if (cardsErr) throw cardsErr;

      const localized = filterCardsByLanguage(
        (cardsData ?? []) as MotivationalCardRow[],
        language
      );
      setCards(localized);

      if (user) {
        const { data: savedData, error: savedErr } = await supabase
          .from('saved_cards')
          .select('card_id')
          .eq('user_id', user.id);

        if (!savedErr && savedData) {
          setSavedIds(new Set(savedData.map((s) => s.card_id)));
        }
      }
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, language, t.common.error]);

  useFocusEffect(
    useCallback(() => {
      fetchCardsAndSaved();
    }, [fetchCardsAndSaved])
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [cards]);

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'saved') {
      return cards.filter((c) => savedIds.has(c.id));
    }
    if (selectedCategory === 'all') {
      return cards;
    }
    return cards.filter((c) => c.category === selectedCategory);
  }, [cards, savedIds, selectedCategory]);

  const safeIndex = filteredCards.length > 0
    ? Math.min(currentIndex, filteredCards.length - 1)
    : 0;
  const activeCard = filteredCards[safeIndex] ?? null;

  const resetFlip = useCallback(() => {
    setIsFlipped(false);
    flipAnim.setValue(0);
  }, [flipAnim]);

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 180;
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 12,
      useNativeDriver: true,
    }).start();
  };

  const animateToCard = useCallback(
    (direction: 'next' | 'prev') => {
      if (filteredCards.length <= 1) return;
      const outX = direction === 'next' ? -40 : 40;
      const inX = direction === 'next' ? 40 : -40;

      Animated.timing(slideAnim, {
        toValue: outX,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        resetFlip();
        setCurrentIndex((prev) => {
          if (direction === 'next') {
            return (prev + 1) % filteredCards.length;
          }
          return (prev - 1 + filteredCards.length) % filteredCards.length;
        });
        slideAnim.setValue(inX);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }).start();
      });
    },
    [filteredCards.length, resetFlip, slideAnim]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dy) < 25,
        onPanResponderMove: (_evt, gestureState) => {
          slideAnim.setValue(gestureState.dx * 0.35);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          if (gestureState.dx < -55) {
            animateToCard('next');
          } else if (gestureState.dx > 55) {
            animateToCard('prev');
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [animateToCard, slideAnim]
  );

  const toggleSave = async () => {
    if (!user || !activeCard) return;
    const isSaved = savedIds.has(activeCard.id);

    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(activeCard.id);
      else next.add(activeCard.id);
      return next;
    });

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_cards')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', activeCard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_cards').insert({
          user_id: user.id,
          card_id: activeCard.id,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      // Revert on error
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(activeCard.id);
        else next.delete(activeCard.id);
        return next;
      });
      Alert.alert(t.common.error, error.message);
    }
  };

  const handleShare = async () => {
    if (!activeCard) return;
    const message = activeCard.back_content
      ? `"${activeCard.front_content}"\n\n${activeCard.back_content}\n— CampusCare`
      : `"${activeCard.front_content}"\n— CampusCare`;
    try {
      await Share.share({ message });
    } catch (_) {
      // Cancelled
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const palette = CARD_PALETTES[safeIndex % CARD_PALETTES.length];
  const isSaved = activeCard ? savedIds.has(activeCard.id) : false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCardsAndSaved();
          }}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header with Lottie Animation */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{t.discover.title}</Text>
          <Text style={styles.subtitle}>{t.discover.subtitle}</Text>
        </View>
        <LottieView
          source={require('../../../assets/lottie/wellness-sparkles.json')}
          autoPlay
          loop
          style={styles.lottieHeader}
        />
      </View>

      {/* Category & Saved Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
          onPress={() => {
            setSelectedCategory('all');
            setCurrentIndex(0);
            resetFlip();
          }}
        >
          <Text style={[styles.filterText, selectedCategory === 'all' && styles.filterTextActive]}>
            {t.discover.allCategories}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'saved' && styles.filterChipActive]}
          onPress={() => {
            setSelectedCategory('saved');
            setCurrentIndex(0);
            resetFlip();
          }}
        >
          <Heart
            size={13}
            color={selectedCategory === 'saved' ? Colors.white : Colors.primary}
            fill={selectedCategory === 'saved' ? Colors.white : 'transparent'}
          />
          <Text style={[styles.filterText, selectedCategory === 'saved' && styles.filterTextActive]}>
            {t.discover.savedOnly} ({savedIds.size})
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
                resetFlip();
              }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Deck or Empty State */}
      {!activeCard ? (
        <Card style={styles.emptyCard}>
          <Illustration name="goals" width={180} height={130} />
          <Text style={styles.emptyTitle}>{t.discover.emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{t.discover.emptySubtitle}</Text>
          <Button
            title={t.discover.showAllCards}
            onPress={() => {
              setSelectedCategory('all');
              setCurrentIndex(0);
            }}
            style={{ marginTop: Spacing.md }}
          />
        </Card>
      ) : (
        <>
          {/* Counter */}
          <Text style={styles.counterText}>
            {t.discover.cardCounter
              .replace('{current}', String(safeIndex + 1))
              .replace('{total}', String(filteredCards.length))}
          </Text>

          {/* 3D Flip + Swipe Flashcard */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.cardStage, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={styles.cardTouch}>
              {/* Front Face */}
              <Animated.View
                style={[
                  styles.flashcard,
                  { backgroundColor: palette.frontBg },
                  { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.categoryPill}>
                    <Sparkles size={13} color={Colors.primary} />
                    <Text style={styles.categoryText}>{activeCard.category}</Text>
                  </View>
                  <RotateCw size={18} color={Colors.muted} />
                </View>

                <View style={styles.cardBodyCenter}>
                  <Text style={styles.cardTitle}>{activeCard.title}</Text>
                  <Text style={styles.frontQuote}>"{activeCard.front_content}"</Text>
                </View>

                <Text style={styles.flipHint}>{t.discover.tapToFlip}</Text>
              </Animated.View>

              {/* Back Face */}
              <Animated.View
                style={[
                  styles.flashcard,
                  styles.flashcardBack,
                  { backgroundColor: palette.backBg },
                  { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{activeCard.category}</Text>
                  </View>
                  <RotateCw size={18} color={Colors.muted} />
                </View>

                <View style={styles.cardBodyCenter}>
                  <Text style={styles.backText}>
                    {activeCard.back_content ?? activeCard.front_content}
                  </Text>
                  {activeCard.author && (
                    <Text style={styles.authorText}>— {activeCard.author}</Text>
                  )}
                </View>

                <Text style={styles.flipHint}>{t.discover.tapToFront}</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {/* Action Bar: Save, Prev/Next, Share */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isSaved && styles.actionBtnSaved]}
              onPress={toggleSave}
              activeOpacity={0.8}
            >
              <Heart
                size={18}
                color={isSaved ? Colors.danger : Colors.navy}
                fill={isSaved ? Colors.danger : 'transparent'}
              />
              <Text style={[styles.actionText, isSaved && { color: Colors.danger }]}>
                {isSaved ? t.discover.savedCard : t.discover.saveCard}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8}>
              <Share2 size={18} color={Colors.navy} />
              <Text style={styles.actionText}>{t.discover.shareCard}</Text>
            </TouchableOpacity>
          </View>

          {filteredCards.length > 1 && (
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => animateToCard('prev')}
                activeOpacity={0.8}
              >
                <ChevronLeft size={20} color={Colors.primary} />
                <Text style={styles.navText}>{t.discover.prevCard}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => animateToCard('next')}
                activeOpacity={0.8}
              >
                <Text style={styles.navText}>{t.discover.nextCard}</Text>
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite },
  container: { flex: 1, backgroundColor: Colors.warmwhite },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  headerTextWrap: { flex: 1, paddingRight: Spacing.sm },
  title: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.navy },
  subtitle: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 4, lineHeight: 18 },
  lottieHeader: { width: 64, height: 64 },
  filterScroll: { gap: 8, paddingBottom: Spacing.md },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.navy },
  filterTextActive: { color: Colors.white },
  counterText: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  cardStage: { height: 310, marginBottom: Spacing.md },
  cardTouch: { flex: 1 },
  flashcard: {
    position: 'absolute',
    inset: 0,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  flashcardBack: {},
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  categoryText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  cardBodyCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xs },
  cardTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  frontQuote: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy, textAlign: 'center', lineHeight: 30 },
  backText: { fontSize: FontSize.base, color: Colors.navy, textAlign: 'center', lineHeight: 25, fontWeight: '500' },
  authorText: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 12, fontWeight: '600' },
  flipHint: { textAlign: 'center', fontSize: 11, color: Colors.muted, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnSaved: { borderColor: '#FAD2D2', backgroundColor: '#FFF5F5' },
  actionText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.navy },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.lavender,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  navText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.navy, marginTop: Spacing.sm, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
