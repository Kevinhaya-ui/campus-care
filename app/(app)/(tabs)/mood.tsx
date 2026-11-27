import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MoodScreen from '../../../src/screens/mood/MoodScreen';
import { Colors } from '../../../src/constants/theme';

export default function MoodTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <MoodScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
});
