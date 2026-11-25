import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Illustration } from '../../src/components/ui/Illustration';
import { useTranslation } from '../../src/i18n/useTranslation';
import { Colors, FontSize } from '../../src/constants/theme';

export default function AiChatScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.center}>
      <Illustration name="aiCompanion" width={210} height={160} />
      <Text style={styles.title}>{t.placeholders.aiTitle}</Text>
      <Text style={styles.sub}>{t.common.comingSoonSprint2}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite, padding: 24 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy, marginTop: 16 },
  sub: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 6 },
});
