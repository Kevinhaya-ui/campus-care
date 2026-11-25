import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../../i18n/useTranslation';
import { Colors, Radius, FontSize } from '../../constants/theme';

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, language === 'id' && styles.pillActive]}
        onPress={() => setLanguage('id')}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, language === 'id' && styles.textActive]}>ID</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pill, language === 'en' && styles.pillActive]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, language === 'en' && styles.textActive]}>EN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.lavender,
    borderRadius: Radius.full,
    padding: 3,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.navy,
  },
  textActive: {
    color: Colors.white,
  },
});
