import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import { colors, spacing, radius, typography } from '../../src/constants/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Errore', 'Le password non coincidono');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Errore', 'La password deve essere di almeno 8 caratteri');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/(app)/home');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registrazione fallita';
      Alert.alert('Errore', msg);
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
        <Text style={styles.subtitle}>Crea il tuo account</Text>

        <View style={styles.form}>
          {[
            { label: 'Nome', value: name, setter: setName, placeholder: 'Il tuo nome', type: 'default' },
            { label: 'Email', value: email, setter: setEmail, placeholder: 'nome@email.com', type: 'email-address' },
            { label: 'Password', value: password, setter: setPassword, placeholder: '••••••••', secure: true },
            { label: 'Conferma password', value: confirm, setter: setConfirm, placeholder: '••••••••', secure: true },
          ].map(({ label, value, setter, placeholder, type, secure }) => (
            <View key={label}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setter}
                keyboardType={type || 'default'}
                autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                secureTextEntry={secure}
                placeholderTextColor={colors.textMuted}
                placeholder={placeholder}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Registrazione...' : 'Crea account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkRow}>
            <Text style={styles.linkText}>Hai già un account? </Text>
            <Text style={[styles.linkText, styles.linkBold]}>Accedi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logo: { ...typography.h1, fontSize: 36, textAlign: 'center', color: colors.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.xl, color: colors.textSecondary },
  form: { gap: spacing.xs },
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
});
