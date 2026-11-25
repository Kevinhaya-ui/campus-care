import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../src/constants/theme';

// Placeholder — to be built in a later sprint
export default function AiChatScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🤖</Text>
      <Text style={styles.title}>AI Companion</Text>
      <Text style={styles.sub}>Coming in Sprint 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warmwhite },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy },
  sub: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 6 },
});
