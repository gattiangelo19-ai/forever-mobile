import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import api from '../../src/config/api';
import { colors, spacing, radius, typography } from '../../src/constants/theme';

const STEPS = ['Dati', 'Foto', 'Voce', 'Chat', 'Preferenze'];

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

export default function CreateProfileScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);

  // Step 0 - Dati
  const [form, setForm] = useState({
    name: '', surname: '', age: '', gender: 'MALE', relationshipType: 'FATHER',
    voiceMessagePercent: 30,
  });

  // Step 1 - Foto
  const [avatar, setAvatar] = useState(null);
  const [photos, setPhotos] = useState([]);

  // Step 2 - Voce
  const [voiceUri, setVoiceUri] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Step 3 - Chat history
  const [chatText, setChatText] = useState('');

  // ─── NAVIGAZIONE STEP ───────────────────────────────────────────────────────
  const next = async () => {
    if (step === 0) await handleCreateProfile();
    else if (step === 1) await handleUploadMedia();
    else if (step === 2) await handleUploadVoice();
    else if (step === 3) await handleUploadChat();
    else if (step === 4) { router.replace('/(app)/home'); return; }
  };

  const skip = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else router.replace('/(app)/home');
  };

  // ─── STEP 0: Crea profilo base ───────────────────────────────────────────────
  const handleCreateProfile = async () => {
    if (!form.name.trim() || !form.surname.trim() || !form.age) {
      Alert.alert('Errore', 'Compila nome, cognome ed età');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/profiles', { ...form, age: parseInt(form.age, 10) });
      setProfileId(data.data.id);
      setStep(1);
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Creazione profilo fallita');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 1: Upload avatar + foto ───────────────────────────────────────────
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0]);
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos(result.assets.slice(0, 10));
  };

  const handleUploadMedia = async () => {
    setLoading(true);
    try {
      if (avatar) {
        const form = new FormData();
        form.append('avatar', { uri: avatar.uri, name: 'avatar.jpg', type: 'image/jpeg' });
        await api.patch(`/profiles/${profileId}/avatar`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (photos.length > 0) {
        const form = new FormData();
        photos.forEach((p, i) => {
          form.append('photos', { uri: p.uri, name: `photo_${i}.jpg`, type: 'image/jpeg' });
        });
        await api.post(`/profiles/${profileId}/photos`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setStep(2);
    } catch (err) {
      Alert.alert('Errore upload', err.response?.data?.error || 'Upload fallito');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: Registra/carica voce ───────────────────────────────────────────
  const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) { Alert.alert('Permesso negato', 'Abilita il microfono'); return; }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(rec);
    setIsRecording(true);
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setRecording(null);
    setIsRecording(false);
    setVoiceUri(uri);
  };

  const pickVoiceFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!result.canceled) setVoiceUri(result.assets[0].uri);
  };

  const handleUploadVoice = async () => {
    if (!voiceUri) { setStep(3); return; } // opzionale
    setLoading(true);
    try {
      const form = new FormData();
      form.append('voice', { uri: voiceUri, name: 'voice.mp3', type: 'audio/mpeg' });
      await api.post(`/profiles/${profileId}/voice`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep(3);
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Upload voce fallito');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 3: Upload chat history ────────────────────────────────────────────
  const pickChatFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'application/zip'] });
    if (result.canceled) return;
    const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
    setChatText(text);
  };

  const handleUploadChat = async () => {
    if (!chatText) { setStep(4); return; } // opzionale
    setLoading(true);
    try {
      await api.post(`/profiles/${profileId}/chat-history`, { chatText });
      setStep(4);
    } catch (err) {
      Alert.alert('Errore', err.response?.data?.error || 'Analisi chat fallita');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER STEP ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return <StepData form={form} setForm={setForm} />;
      case 1: return <StepMedia avatar={avatar} photos={photos} onPickAvatar={pickAvatar} onPickPhotos={pickPhotos} />;
      case 2: return <StepVoice voiceUri={voiceUri} isRecording={isRecording} onStartRec={startRecording} onStopRec={stopRecording} onPickFile={pickVoiceFile} />;
      case 3: return <StepChat chatText={chatText} onPickFile={pickChatFile} />;
      case 4: return <StepPreferences form={form} setForm={setForm} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.progressDot, i <= step && styles.progressDotActive]}>
            <Text style={[styles.progressLabel, i <= step && styles.progressLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      {/* Azioni */}
      <View style={styles.actions}>
        {step > 0 && step < 4 && (
          <TouchableOpacity onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Salta</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, loading && styles.btnDisabled]}
          onPress={next}
          disabled={loading}
        >
          <Text style={styles.nextText}>
            {loading ? 'Attendere...' : step === STEPS.length - 1 ? 'Fine' : 'Avanti'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── COMPONENTI STEP ────────────────────────────────────────────────────────

function StepData({ form, setForm }) {
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  return (
    <View style={styles.stepContainer}>
      <Text style={typography.h2}>Chi era?</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg, marginTop: spacing.xs }]}>
        Inserisci le informazioni della persona che vuoi ricordare
      </Text>
      {[
        { key: 'name', label: 'Nome', placeholder: 'Mario' },
        { key: 'surname', label: 'Cognome', placeholder: 'Rossi' },
        { key: 'age', label: 'Età', placeholder: '65', keyboard: 'numeric' },
      ].map(({ key, label, placeholder, keyboard }) => (
        <View key={key}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={form[key]}
            onChangeText={set(key)}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboard || 'default'}
          />
        </View>
      ))}

      <Text style={styles.label}>Sesso</Text>
      <View style={styles.pillRow}>
        {[{ v: 'MALE', l: 'Uomo' }, { v: 'FEMALE', l: 'Donna' }, { v: 'OTHER', l: 'Altro' }].map(({ v, l }) => (
          <TouchableOpacity
            key={v}
            style={[styles.pill, form.gender === v && styles.pillActive]}
            onPress={() => set('gender')(v)}
          >
            <Text style={[styles.pillText, form.gender === v && styles.pillTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Relazione con te</Text>
      <View style={styles.pillRow}>
        {RELATIONSHIPS.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[styles.pill, form.relationshipType === value && styles.pillActive]}
            onPress={() => set('relationshipType')(value)}
          >
            <Text style={[styles.pillText, form.relationshipType === value && styles.pillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepMedia({ avatar, photos, onPickAvatar, onPickPhotos }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={typography.h2}>Foto</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg, marginTop: spacing.xs }]}>
        Carica l'immagine del profilo e altre foto. Verranno usate per generare nuove immagini.
      </Text>

      <TouchableOpacity style={styles.uploadBox} onPress={onPickAvatar}>
        {avatar ? (
          <Image source={{ uri: avatar.uri }} style={styles.avatarPreview} />
        ) : (
          <Text style={styles.uploadIcon}>📷</Text>
        )}
        <Text style={styles.uploadLabel}>Foto profilo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.uploadBox, { marginTop: spacing.md }]} onPress={onPickPhotos}>
        <Text style={styles.uploadIcon}>🖼</Text>
        <Text style={styles.uploadLabel}>
          {photos.length > 0 ? `${photos.length} foto selezionate` : 'Altre foto (opzionale)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepVoice({ voiceUri, isRecording, onStartRec, onStopRec, onPickFile }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={typography.h2}>Messaggio vocale</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg, marginTop: spacing.xs }]}>
        Carica o registra un messaggio vocale della persona defunta. Servirà a replicarne la voce.
      </Text>

      <TouchableOpacity
        style={[styles.uploadBox, isRecording && { borderColor: colors.error }]}
        onPress={isRecording ? onStopRec : onStartRec}
      >
        <Text style={styles.uploadIcon}>{isRecording ? '⏹' : '🎤'}</Text>
        <Text style={styles.uploadLabel}>
          {isRecording ? 'Tocca per fermare' : voiceUri ? '✓ Registrazione salvata' : 'Registra ora'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.uploadBox, { marginTop: spacing.md }]} onPress={onPickFile}>
        <Text style={styles.uploadIcon}>📁</Text>
        <Text style={styles.uploadLabel}>{voiceUri ? '✓ File caricato' : 'Carica file audio'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepChat({ chatText, onPickFile }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={typography.h2}>Storico chat</Text>
      <Text style={[typography.caption, { marginBottom: spacing.md, marginTop: spacing.xs }]}>
        Importa l'export della vostra chat WhatsApp o Telegram. L'AI imparerà il suo stile di scrittura.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📱 WhatsApp: Chat → Esporta chat → Senza media → .txt{'\n'}
          ✈️ Telegram: Desktop → Menu profilo → Esporta → .json
        </Text>
      </View>

      <TouchableOpacity style={[styles.uploadBox, { marginTop: spacing.md }]} onPress={onPickFile}>
        <Text style={styles.uploadIcon}>📄</Text>
        <Text style={styles.uploadLabel}>
          {chatText ? `✓ ${Math.round(chatText.length / 1000)}K caratteri caricati` : 'Seleziona file chat'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepPreferences({ form, setForm }) {
  const percent = form.voiceMessagePercent;
  const set = (val) => setForm((f) => ({ ...f, voiceMessagePercent: val }));

  return (
    <View style={styles.stepContainer}>
      <Text style={typography.h2}>Preferenze</Text>
      <Text style={[typography.caption, { marginBottom: spacing.lg, marginTop: spacing.xs }]}>
        Con quale frequenza vuoi ricevere messaggi vocali?
      </Text>

      <View style={styles.preferenceCard}>
        <View style={styles.preferenceRow}>
          <Text style={styles.prefLabel}>💬 Testo</Text>
          <Text style={styles.prefLabel}>🎤 Voce</Text>
        </View>
        <View style={styles.sliderRow}>
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.sliderDot, percent === v && styles.sliderDotActive]}
              onPress={() => set(v)}
            />
          ))}
        </View>
        <Text style={styles.percentText}>
          {100 - percent}% testo · {percent}% vocale
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ✓ Profilo creato con successo!{'\n'}
          Puoi modificare queste impostazioni in qualsiasi momento dal profilo.
        </Text>
      </View>
    </View>
  );
}

// ─── STILI ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressDot: { alignItems: 'center' },
  progressDotActive: {},
  progressLabel: { fontSize: 11, color: colors.textMuted },
  progressLabelActive: { color: colors.primary, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: 120 },
  stepContainer: {},
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.textSecondary, fontSize: 13 },
  pillTextActive: { color: colors.white, fontWeight: '600' },
  uploadBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  uploadIcon: { fontSize: 36, marginBottom: spacing.sm },
  uploadLabel: { color: colors.textSecondary, fontSize: 14 },
  avatarPreview: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.sm },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginTop: spacing.sm,
  },
  infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  preferenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  prefLabel: { color: colors.textPrimary, fontSize: 15 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sliderDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1, borderColor: colors.border,
  },
  sliderDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  percentText: { textAlign: 'center', color: colors.textSecondary, fontSize: 13 },
  actions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  skipBtn: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: { color: colors.textSecondary, fontWeight: '600' },
  nextBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  nextText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
