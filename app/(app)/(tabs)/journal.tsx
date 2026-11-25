import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../../src/constants/theme';

export default function JournalTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.emoji}>📔</Text>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.sub}>Coming soon in this sprint</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy },
  sub: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 6 },
});
