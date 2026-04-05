import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, Platform, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../src/config/api';
import { colors, spacing, radius, typography } from '../../src/constants/theme';

const RELATIONSHIPS = [
  { value: 'FATHER', label: 'Padre' }, { value: 'MOTHER', label: 'Madre' },
  { value: 'SON', label: 'Figlio' }, { value: 'DAUGHTER', label: 'Figlia' },
  { value: 'HUSBAND', label: 'Marito' }, { value: 'WIFE', label: 'Moglie' },
  { value: 'BOYFRIEND', label: 'Fidanzato' }, { value: 'GIRLFRIEND', label: 'Fidanzata' },
  { value: 'FRIEND_MALE', label: 'Amico' }, { value: 'FRIEND_FEMALE', label: 'Amica' },
  { value: 'GRANDFATHER', label: 'Nonno' }, { value: 'GRANDMOTHER', label: 'Nonna' },
  { value: 'BROTHER', label: 'Fratello' }, { value: 'SISTER', label: 'Sorella' },
  { value: 'OTHER', label: 'Altro' },
];

const SECTIONS = ['Dati', 'Foto', 'Voce', 'Chat', 'Preferenze'];

export default function EditProfileScreen() {
  const { profileId } = useLocalSearchParams();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState('Dati');
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', surname: '', age: '', gender: 'MALE',
    relationshipType: 'FATHER', voiceMessagePercent: 30,
  });
  // Media nuovi (selezionati dall'utente per sostituire quelli esistenti)
  const [avatar, setAvatar] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [voiceUri, setVoiceUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatText, setChatText] = useState('');

  // Dati esistenti già salvati sul server
  const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [existingVoiceUrl, setExistingVoiceUrl] = useState(null);
  const [existingLanguageStyle, setExistingLanguageStyle] = useState(null);
  const [chatExportName, setChatExportName] = useState('');

  // Carica dati profilo esistente
  useEffect(() => {
    api.get(`/profiles/${profileId}`)
      .then(({ data }) => {
        const p = data.data;
        setForm({
          name: p.name,
          surname: p.surname,
          age: String(p.age),
          gender: p.gender,
          relationshipType: p.relationshipType,
          voiceMessagePercent: p.voiceMessagePercent,
        });
        setExistingAvatarUrl(p.avatarUrl || null);
        setExistingPhotoUrls(p.photoUrls || []);
        setExistingVoiceUrl(p.voiceSampleUrl || null);
        setExistingLanguageStyle(p.languageStyle || null);
        setChatExportName(p.chatExportName || '');
      })
      .catch(() => Alert.alert('Errore', 'Impossibile caricare il profilo'))
      .finally(() => setLoadingInit(false));
  }, [profileId]);

  // ─── SALVATAGGIO PER SEZIONE ─────────────────────────────────────────────────
  const saveDati = async () => {
    if (!form.name.trim() || !form.surname.trim() || !form.age) {
      Alert.alert('Errore', 'Compila nome, cognome ed età');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/profiles/${profileId}`, { ...form, age: parseInt(form.age, 10) });
      Alert.alert('✓ Salvato', 'Dati aggiornati');
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Salvataggio fallito');
    } finally {
      setSaving(false);
    }
  };

  const saveAvatar = async () => {
    if (!avatar) return;
    setSaving(true);
    try {
      const f = new FormData();
      f.append('avatar', { uri: avatar.uri, name: 'avatar.jpg', type: 'image/jpeg' });
      await api.patch(`/profiles/${profileId}/avatar`, f, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('✓ Salvato', 'Foto profilo aggiornata');
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Upload fallito');
    } finally {
      setSaving(false);
    }
  };

  const savePhotos = async () => {
    if (!photos.length) return;
    setSaving(true);
    try {
      const f = new FormData();
      photos.forEach((p, i) =>
        f.append('photos', { uri: p.uri, name: `photo_${i}.jpg`, type: 'image/jpeg' })
      );
      await api.post(`/profiles/${profileId}/photos`, f, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('✓ Salvato', `${photos.length} foto aggiunte`);
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Upload fallito');
    } finally {
      setSaving(false);
    }
  };

  const saveVoice = async () => {
    if (!voiceUri) return;
    setSaving(true);
    try {
      const f = new FormData();
      f.append('voice', { uri: voiceUri, name: 'voice.mp3', type: 'audio/mpeg' });
      await api.post(`/profiles/${profileId}/voice`, f, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('✓ Salvato', 'Voce aggiornata');
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Upload fallito');
    } finally {
      setSaving(false);
    }
  };

  const saveChat = async () => {
    if (!chatText) return;
    setSaving(true);
    try {
      await api.post(`/profiles/${profileId}/chat-history`, { chatText, chatExportName });
      Alert.alert('✓ Salvato', 'Chat analizzata e stile aggiornato');
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Analisi fallita');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await api.patch(`/profiles/${profileId}`, {
        voiceMessagePercent: form.voiceMessagePercent,
      });
      Alert.alert('✓ Salvato', 'Preferenze aggiornate');
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Salvataggio fallito');
    } finally {
      setSaving(false);
    }
  };

  // ─── MEDIA HELPERS ───────────────────────────────────────────────────────────
  const pickAvatar = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!r.canceled) setAvatar(r.assets[0]);
  };

  const pickPhotos = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8,
    });
    if (!r.canceled) setPhotos(r.assets.slice(0, 10));
  };

  const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) { Alert.alert('Permesso negato', 'Abilita il microfono'); return; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(rec);
    setIsRecording(true);
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    setVoiceUri(recording.getURI());
    setRecording(null);
    setIsRecording(false);
  };

  const pickVoiceFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!r.canceled) setVoiceUri(r.assets[0].uri);
  };

  const pickChatFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['text/plain'] });
    if (r.canceled) return;
    const asset = r.assets[0];
    if (asset.file) {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(asset.file, 'utf-8');
      });
      setChatText(text);
      return;
    }
    setChatText(await FileSystem.readAsStringAsync(asset.uri));
  };

  if (loadingInit) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const renderSection = () => {
    switch (activeSection) {
      case 'Dati':
        return (
          <View>
            {[
              { key: 'name', label: 'Nome' },
              { key: 'surname', label: 'Cognome' },
              { key: 'age', label: 'Età', keyboard: 'numeric' },
            ].map(({ key, label, keyboard }) => (
              <View key={key}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={set(key)}
                  keyboardType={keyboard || 'default'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}

            <Text style={styles.label}>Sesso</Text>
            <View style={styles.pillRow}>
              {[{ v: 'MALE', l: 'Uomo' }, { v: 'FEMALE', l: 'Donna' }, { v: 'OTHER', l: 'Altro' }].map(({ v, l }) => (
                <TouchableOpacity key={v} style={[styles.pill, form.gender === v && styles.pillActive]} onPress={() => set('gender')(v)}>
                  <Text style={[styles.pillText, form.gender === v && styles.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Relazione</Text>
            <View style={styles.pillRow}>
              {RELATIONSHIPS.map(({ value, label }) => (
                <TouchableOpacity key={value} style={[styles.pill, form.relationshipType === value && styles.pillActive]} onPress={() => set('relationshipType')(value)}>
                  <Text style={[styles.pillText, form.relationshipType === value && styles.pillTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SaveButton onPress={saveDati} saving={saving} />
          </View>
        );

      case 'Foto':
        return (
          <View>
            {/* Avatar esistente */}
            <Text style={styles.sectionLabel}>Foto profilo attuale</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar.uri }} style={styles.avatarPreview} />
              ) : existingAvatarUrl ? (
                <Image source={{ uri: existingAvatarUrl }} style={styles.avatarPreview} />
              ) : (
                <Text style={styles.uploadIcon}>📷</Text>
              )}
              <Text style={styles.uploadLabel}>
                {avatar ? '✓ Nuova foto selezionata — tocca Salva' : existingAvatarUrl ? 'Tocca per cambiare' : 'Carica foto profilo'}
              </Text>
            </TouchableOpacity>
            {avatar && <SaveButton onPress={saveAvatar} saving={saving} label="Salva foto profilo" />}

            {/* Foto aggiuntive esistenti */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              Foto aggiuntive ({existingPhotoUrls.length} caricate)
            </Text>
            {existingPhotoUrls.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                {existingPhotoUrls.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.photoThumb} />
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={[styles.uploadBox, { marginTop: spacing.sm }]} onPress={pickPhotos}>
              <Text style={styles.uploadIcon}>🖼</Text>
              <Text style={styles.uploadLabel}>
                {photos.length > 0 ? `✓ ${photos.length} nuove foto selezionate` : 'Aggiungi altre foto'}
              </Text>
            </TouchableOpacity>
            {photos.length > 0 && <SaveButton onPress={savePhotos} saving={saving} label="Salva foto aggiuntive" />}
          </View>
        );

      case 'Voce':
        return (
          <View>
            {/* Voce esistente */}
            {existingVoiceUrl && (
              <View style={styles.existingCard}>
                <Text style={styles.existingIcon}>🎙</Text>
                <View style={styles.existingInfo}>
                  <Text style={styles.existingTitle}>Campione vocale caricato</Text>
                  <Text style={styles.existingSubtitle}>La voce è già stata clonata. Puoi caricare un nuovo campione per aggiornarla.</Text>
                </View>
              </View>
            )}

            <Text style={[styles.sectionLabel, { marginTop: existingVoiceUrl ? spacing.lg : 0 }]}>
              {existingVoiceUrl ? 'Sostituisci campione vocale' : 'Carica campione vocale'}
            </Text>
            <TouchableOpacity
              style={[styles.uploadBox, isRecording && { borderColor: colors.error }]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.uploadIcon}>{isRecording ? '⏹' : '🎤'}</Text>
              <Text style={styles.uploadLabel}>
                {isRecording ? 'Tocca per fermare' : voiceUri ? '✓ Nuova registrazione' : 'Registra ora'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadBox, { marginTop: spacing.sm }]} onPress={pickVoiceFile}>
              <Text style={styles.uploadIcon}>📁</Text>
              <Text style={styles.uploadLabel}>{voiceUri ? '✓ File selezionato' : 'Carica file audio'}</Text>
            </TouchableOpacity>

            {voiceUri && <SaveButton onPress={saveVoice} saving={saving} label="Aggiorna voce" />}
          </View>
        );

      case 'Chat':
        return (
          <View>
            {/* Stile linguistico esistente */}
            {existingLanguageStyle && (
              <View style={styles.existingCard}>
                <Text style={styles.existingIcon}>🧠</Text>
                <View style={styles.existingInfo}>
                  <Text style={styles.existingTitle}>Stile linguistico analizzato</Text>
                  <Text style={styles.existingSubtitle}>
                    Tono: {existingLanguageStyle.tone || '—'} · Frasi tipiche: {existingLanguageStyle.commonPhrases?.slice(0, 2).join(', ') || '—'}
                  </Text>
                  {existingLanguageStyle.commonEmojis?.length > 0 && (
                    <Text style={styles.existingSubtitle}>
                      Emoji: {existingLanguageStyle.commonEmojis.join(' ')}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <Text style={[styles.sectionLabel, { marginTop: existingLanguageStyle ? spacing.lg : 0 }]}>
              {existingLanguageStyle ? 'Aggiorna con nuova chat' : 'Carica storico chat'}
            </Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📱 WhatsApp: Chat → Esporta chat → Senza media → .txt{'\n'}
                ✈️ Telegram: Desktop → Menu profilo → Esporta → .json
              </Text>
            </View>
            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Come appare il suo nome nella chat?
            </Text>
            <Text style={[styles.label, { color: colors.textMuted, marginTop: 0 }]}>
              Es. "Mamma", "Marco R.", "Papà ❤️" — esattamente come lo vedi nell'export
            </Text>
            <TextInput
              style={styles.input}
              value={chatExportName}
              onChangeText={setChatExportName}
              placeholder="Nome come appare nella chat..."
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={[styles.uploadBox, { marginTop: spacing.sm }]} onPress={pickChatFile}>
              <Text style={styles.uploadIcon}>📄</Text>
              <Text style={styles.uploadLabel}>
                {chatText ? `✓ ${Math.round(chatText.length / 1000)}K caratteri caricati` : 'Seleziona file chat'}
              </Text>
            </TouchableOpacity>
            {chatText.length > 0 && <SaveButton onPress={saveChat} saving={saving} label="Analizza e aggiorna" />}
          </View>
        );

      case 'Preferenze':
        return (
          <View>
            <View style={styles.preferenceCard}>
              <View style={styles.preferenceRow}>
                <Text style={styles.prefLabel}>💬 Testo</Text>
                <Text style={styles.prefLabel}>🎤 Voce</Text>
              </View>
              <View style={styles.sliderRow}>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.sliderDot, form.voiceMessagePercent === v && styles.sliderDotActive]}
                    onPress={() => set('voiceMessagePercent')(v)}
                  />
                ))}
              </View>
              <Text style={styles.percentText}>
                {100 - form.voiceMessagePercent}% testo · {form.voiceMessagePercent}% vocale
              </Text>
            </View>
            <SaveButton onPress={savePreferences} saving={saving} label="Salva preferenze" />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab sezioni */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarInner}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, activeSection === s && styles.tabActive]}
            onPress={() => setActiveSection(s)}
          >
            <Text style={[styles.tabText, activeSection === s && styles.tabTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {renderSection()}
      </ScrollView>
    </View>
  );
}

function SaveButton({ onPress, saving, label = 'Salva' }) {
  return (
    <TouchableOpacity
      style={[styles.saveBtn, saving && styles.btnDisabled]}
      onPress={onPress}
      disabled={saving}
    >
      {saving
        ? <ActivityIndicator color={colors.white} />
        : <Text style={styles.saveBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  tabBar: { borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 52 },
  tabBarInner: { paddingHorizontal: spacing.md, gap: spacing.xs },
  tab: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  content: { padding: spacing.lg, paddingBottom: 60 },

  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface, color: colors.textPrimary,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 16, marginBottom: spacing.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.textSecondary, fontSize: 13 },
  pillTextActive: { color: colors.white, fontWeight: '600' },

  uploadBox: {
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.sm,
  },
  uploadIcon: { fontSize: 36, marginBottom: spacing.sm },
  uploadLabel: { color: colors.textSecondary, fontSize: 14 },
  avatarPreview: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.sm },

  infoBox: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.primary, marginBottom: spacing.sm,
  },
  infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },

  preferenceCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  prefLabel: { color: colors.textPrimary, fontSize: 15 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sliderDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border,
  },
  sliderDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  percentText: { textAlign: 'center', color: colors.textSecondary, fontSize: 13 },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  sectionLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },

  existingCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  existingIcon: { fontSize: 28, marginRight: spacing.md },
  existingInfo: { flex: 1 },
  existingTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 14, marginBottom: 4 },
  existingSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },

  photoRow: { marginBottom: spacing.sm },
  photoThumb: {
    width: 80, height: 80, borderRadius: radius.md,
    marginRight: spacing.sm, backgroundColor: colors.surfaceLight,
  },
});
