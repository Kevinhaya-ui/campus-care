import React from 'react';
import {
  SafeAreaView, View, Text, StyleSheet,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { Colors, FontSize, Spacing, Radius } from '../../../src/constants/theme';

export default function ProfileTab() {
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          {profile?.university && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>University</Text>
              <Text style={styles.infoValue}>{profile.university}</Text>
            </View>
          )}
          {profile?.semester && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Semester</Text>
              <Text style={styles.infoValue}>{profile.semester}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Language</Text>
            <Text style={styles.infoValue}>{profile?.preferred_language === 'id' ? 'Bahasa Indonesia' : 'English'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AI Style</Text>
            <Text style={styles.infoValue}>{profile?.communication_style ?? 'Friendly'}</Text>
          </View>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Your mental wellness data is private and encrypted. CampusCare never shares your personal information without your explicit consent.
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  infoLabel: { fontSize: FontSize.sm, color: Colors.muted, fontWeight: '500' },
  infoValue: { fontSize: FontSize.sm, color: Colors.navy, fontWeight: '600' },
  privacyBox: {
    flexDirection: 'row', backgroundColor: Colors.lavender,
    borderRadius: Radius.md, padding: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.xl,
  },
  privacyIcon: { fontSize: 20 },
  privacyText: { flex: 1, fontSize: FontSize.xs, color: Colors.navy, lineHeight: 18 },
  signOutBtn: {
    borderWidth: 1.5, borderColor: Colors.danger,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center',
  },
  signOutText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.base },
});
