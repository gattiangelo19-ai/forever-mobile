import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';
import useAuthStore from '../../src/store/authStore';
import { colors, spacing, radius, typography } from '../../src/constants/theme';

const RELATIONSHIP_LABELS = {
  FATHER: 'Padre', MOTHER: 'Madre', SON: 'Figlio', DAUGHTER: 'Figlia',
  HUSBAND: 'Marito', WIFE: 'Moglie', BOYFRIEND: 'Fidanzato',
  GIRLFRIEND: 'Fidanzata', FRIEND_MALE: 'Amico', FRIEND_FEMALE: 'Amica',
  GRANDFATHER: 'Nonno', GRANDMOTHER: 'Nonna', BROTHER: 'Fratello',
  SISTER: 'Sorella', OTHER: 'Persona cara',
};

export default function HomeScreen() {
  const [profiles, setProfiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const fetchProfiles = useCallback(async () => {
    try {
      const { data } = await api.get('/profiles');
      setProfiles(data.data);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare i profili');
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: logout },
    ]);
  };

  const renderProfile = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/chat/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name} {item.surname}</Text>
        <Text style={styles.cardRelation}>{RELATIONSHIP_LABELS[item.relationshipType]}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ForEver</Text>
          <Text style={styles.headerSub}>Ciao, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Esci</Text>
        </TouchableOpacity>
      </View>

      {/* Lista profili */}
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={renderProfile}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💜</Text>
            <Text style={styles.emptyTitle}>Nessun profilo ancora</Text>
            <Text style={styles.emptyText}>
              Crea il primo profilo per ricominciare a parlare con chi ami
            </Text>
          </View>
        }
      />

      {/* FAB - Nuovo profilo */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/onboarding/create-profile')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h2, color: colors.primary },
  headerSub: { ...typography.caption, marginTop: 2 },
  logoutBtn: { padding: spacing.sm },
  logoutText: { color: colors.textSecondary, fontSize: 14 },

  list: { padding: spacing.md, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: { position: 'relative', marginRight: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: colors.white, fontSize: 22, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2, borderColor: colors.surface,
  },
  cardInfo: { flex: 1 },
  cardName: { ...typography.body, fontWeight: '600' },
  cardRelation: { ...typography.caption, marginTop: 2 },
  arrow: { color: colors.textMuted, fontSize: 24, fontWeight: '300' },

  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptyText: { ...typography.caption, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: { color: colors.white, fontSize: 32, fontWeight: '300', lineHeight: 36 },
});
