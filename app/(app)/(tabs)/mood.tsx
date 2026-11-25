import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Illustration } from '../../../src/components/ui/Illustration';
import { useTranslation } from '../../../src/i18n/useTranslation';
import { Colors, FontSize } from '../../../src/constants/theme';

export default function MoodTab() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Illustration name="moodCheckin" width={200} height={150} />
        <Text style={styles.title}>{t.placeholders.moodTitle}</Text>
        <Text style={styles.sub}>{t.common.comingSoon}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy, marginTop: 16 },
  sub: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 6 },
});
