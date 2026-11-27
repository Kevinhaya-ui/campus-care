import React from 'react';
import {
  SafeAreaView, View, Text, StyleSheet,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { useTranslation } from '../../../src/i18n/useTranslation';
import { LanguageToggle } from '../../../src/components/ui/LanguageToggle';
import { FadeInView } from '../../../src/components/ui/AnimatedPrimitives';
import { Colors, FontSize, Spacing, Radius } from '../../../src/constants/theme';

export default function ProfileTab() {
  const { profile, signOut } = useAuthStore();
  const { t } = useTranslation();

  const handleSignOut = () => {
    Alert.alert(
      t.profile.signOutConfirmTitle,
      t.profile.signOutConfirmMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.profile.signOut, style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <FadeInView delay={0}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text style={styles.name}>{profile?.full_name ?? t.profile.defaultUser}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
          </View>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.infoSection}>
            {profile?.university && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.profile.university}</Text>
                <Text style={styles.infoValue}>{profile.university}</Text>
              </View>
            )}
            {profile?.semester && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.profile.semester}</Text>
                <Text style={styles.infoValue}>{profile.semester}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.profile.language}</Text>
              <LanguageToggle />
            </View>
            <View style={[styles.infoRow, styles.lastRow]}>
              <Text style={styles.infoLabel}>{t.profile.aiStyle}</Text>
              <Text style={styles.infoValue}>{profile?.communication_style ?? 'friendly'}</Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={160}>
          <View style={styles.privacyBox}>
            <ShieldCheck size={20} color={Colors.primary} style={styles.privacyIcon} />
            <Text style={styles.privacyText}>{t.profile.privacyNote}</Text>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>{t.profile.signOut}</Text>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmwhite },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: 32, color: Colors.white, fontWeight: '700' },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.navy },
  email: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 4 },
  infoSection: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    overflow: 'hidden', marginBottom: Spacing.md,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  lastRow: { borderBottomWidth: 0 },
  infoLabel: { fontSize: FontSize.sm, color: Colors.muted, fontWeight: '500' },
  infoValue: { fontSize: FontSize.sm, color: Colors.navy, fontWeight: '600', textTransform: 'capitalize' },
  privacyBox: {
    flexDirection: 'row', backgroundColor: Colors.lavender,
    borderRadius: Radius.md, padding: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.xl,
  },
  privacyIcon: { marginTop: 2 },
  privacyText: { flex: 1, fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
  signOutBtn: {
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center',
  },
  signOutText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.base },
});
