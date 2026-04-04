import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import { colors, spacing, radius, typography } from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Errore', 'Inserisci email e password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(app)/home');
    } catch (err) {
      const msg = err.response?.data?.error || 'Credenziali non valide';
      Alert.alert('Accesso negato', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>ForEver</Text>
        <Text style={styles.tagline}>Alcune persone non ci lasciano mai davvero</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholderTextColor={colors.textMuted}
            placeholder="nome@email.com"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholderTextColor={colors.textMuted}
            placeholder="••••••••"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Accesso...' : 'Accedi'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
            <Text style={styles.linkText}>Non hai un account? </Text>
            <Text style={[styles.linkText, styles.linkBold]}>Registrati</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          ForEver è una simulazione AI. In caso di necessità contatta un professionista del supporto al lutto.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logo: { ...typography.h1, fontSize: 42, textAlign: 'center', color: colors.primary, marginBottom: spacing.xs },
  tagline: { ...typography.caption, textAlign: 'center', marginBottom: spacing.xxl, fontStyle: 'italic' },
  form: { gap: spacing.sm },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    fontStyle: 'italic',
  },
});
