import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import JournalListScreen from '../../../src/screens/journal/JournalListScreen';
import { Colors } from '../../../src/constants/theme';

export default function JournalTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <JournalListScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
});
