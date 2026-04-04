import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Linking, ActivityIndicator,
} from 'react-native';
import api from '../config/api';
import { colors, spacing, radius, typography } from '../constants/theme';

const PLANS = [
  {
    plan: 'BASE',
    name: 'Base',
    price: '€3,99',
    period: '/mese',
    features: ['300 messaggi/mese', '1 profilo', 'Messaggi vocali'],
    color: colors.primary,
  },
  {
    plan: 'PLUS',
    name: 'Plus',
    price: '€7,99',
    period: '/mese',
    features: ['Messaggi illimitati', '3 profili', 'Voce + Immagini generate'],
    color: '#9B59B6',
    recommended: true,
  },
  {
    plan: 'FAMILY',
    name: 'Family',
    price: '€14,99',
    period: '/mese',
    features: ['Messaggi illimitati', '10 profili', 'Voce + Immagini generate'],
    color: '#6C3483',
  },
];

export default function PaywallScreen({ onDismiss }) {
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (plan) => {
    setLoading(plan);
    try {
      const { data } = await api.post('/billing/checkout', { plan });
      // Apre il checkout Stripe nel browser
      await Linking.openURL(data.data.url);
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Impossibile avviare il pagamento');
    } finally {
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading('portal');
    try {
      const { data } = await api.post('/billing/portal');
      await Linking.openURL(data.data.url);
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Impossibile aprire il portale');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scegli il tuo piano</Text>
        <Text style={styles.subtitle}>
          Cancella quando vuoi. Nessun vincolo.
        </Text>

        {PLANS.map((p) => (
          <View key={p.plan} style={[styles.card, p.recommended && styles.cardRecommended]}>
            {p.recommended && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Più scelto</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{p.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: p.color }]}>{p.price}</Text>
                <Text style={styles.period}>{p.period}</Text>
              </View>
            </View>

            <View style={styles.featureList}>
              {p.features.map((f) => (
                <Text key={f} style={styles.feature}>✓  {f}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: p.color }, loading && styles.btnDisabled]}
              onPress={() => handleSubscribe(p.plan)}
              disabled={!!loading}
            >
              {loading === p.plan
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnText}>Abbonati</Text>
              }
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity onPress={handleManage} style={styles.manageBtn} disabled={!!loading}>
          {loading === 'portal'
            ? <ActivityIndicator color={colors.textSecondary} />
            : <Text style={styles.manageText}>Gestisci abbonamento esistente</Text>
          }
        </TouchableOpacity>

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Continua con il piano Free</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.legal}>
          Pagamento sicuro tramite Stripe. Puoi disdire in qualsiasi momento
          dal portale di gestione abbonamento.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.lg, paddingBottom: spacing.xxl },

  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.caption, textAlign: 'center', marginBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRecommended: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planName: { ...typography.h3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 26, fontWeight: '800' },
  period: { ...typography.caption, marginLeft: 4 },

  featureList: { marginBottom: spacing.md, gap: spacing.xs },
  feature: { color: colors.textSecondary, fontSize: 14 },

  btn: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  manageBtn: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  manageText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline' },

  dismissBtn: { alignItems: 'center', marginTop: spacing.sm, padding: spacing.sm },
  dismissText: { color: colors.textMuted, fontSize: 13 },

  legal: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    fontStyle: 'italic',
  },
});
