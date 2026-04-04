import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';
import useAuthStore from '../../src/store/authStore';
import PaywallScreen from '../../src/screens/PaywallScreen';
import { colors, spacing, radius, typography } from '../../src/constants/theme';

const PLAN_LABELS = {
  FREE:   { label: 'Free',   color: colors.textMuted },
  BASE:   { label: 'Base',   color: colors.primary },
  PLUS:   { label: 'Plus',   color: '#9B59B6' },
  FAMILY: { label: 'Family', color: '#6C3483' },
};

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get('/billing/subscription')
      .then(({ data }) => setSubscription(data.data.subscription))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  };

  const planInfo = PLAN_LABELS[user?.plan] || PLAN_LABELS.FREE;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Impostazioni</Text>

        {/* Profilo utente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nome</Text>
            <Text style={styles.rowValue}>{user?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email}</Text>
          </View>
        </View>

        {/* Piano corrente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abbonamento</Text>
          <View style={styles.planCard}>
            <View>
              <Text style={styles.rowLabel}>Piano attivo</Text>
              <Text style={[styles.planName, { color: planInfo.color }]}>
                {planInfo.label}
              </Text>
            </View>
            {user?.plan !== 'FREE' && subscription && (
              <View style={styles.planMeta}>
                <Text style={styles.rowLabel}>
                  {subscription.cancelAtPeriodEnd ? 'Scade il' : 'Rinnovo il'}
                </Text>
                <Text style={styles.rowValue}>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('it-IT')}
                </Text>
              </View>
            )}
          </View>

          {user?.plan === 'FREE' ? (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.upgradeBtnText}>✦  Passa a un piano Premium</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.manageBtnText}>Gestisci abbonamento</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Esci dall'account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>ForEver v1.0.0</Text>
        <Text style={styles.disclaimer}>
          ForEver è una simulazione AI.{'\n'}
          Se hai bisogno di supporto, rivolgiti a un professionista.
        </Text>
      </ScrollView>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen onDismiss={() => setShowPaywall(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.lg, paddingBottom: spacing.xxl },

  title: { ...typography.h2, marginBottom: spacing.xl },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { ...typography.caption, marginBottom: spacing.md, color: colors.textSecondary },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: { color: colors.textSecondary, fontSize: 14 },
  rowValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },

  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  planMeta: { alignItems: 'flex-end' },

  upgradeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  upgradeBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  manageBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  manageBtnText: { color: colors.textSecondary, fontSize: 14 },

  logoutBtn: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },

  version: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
