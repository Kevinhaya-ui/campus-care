import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import DiscoverScreen from '../../../src/screens/discover/DiscoverScreen';
import { Colors } from '../../../src/constants/theme';

export default function DiscoverTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <DiscoverScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
});
