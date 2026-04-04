import React, { useState, useCallback } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Animated, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { colors, spacing, radius } from '../../constants/theme';

export default function VoiceRecorder({ onRecordingComplete, disabled }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const pulse = React.useRef(new Animated.Value(1)).current;
  const timerRef = React.useRef(null);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulse.stopAnimation();
    pulse.setValue(1);
  };

  const startRecording = useCallback(async () => {
    if (disabled) return;
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permesso negato', 'Abilita il microfono nelle impostazioni del dispositivo.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setDuration(0);
      startPulse();

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= 120) { stopRecording(); return d; } // max 2 minuti
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      Alert.alert('Errore', 'Impossibile avviare la registrazione');
    }
  }, [disabled]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    clearInterval(timerRef.current);
    stopPulse();
    setIsRecording(false);

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    setRecording(null);
    setDuration(0);

    if (uri) onRecordingComplete(uri);
  }, [recording, onRecordingComplete]);

  const formatDuration = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.dot} />
          <Text style={styles.timer}>{formatDuration(duration)}</Text>
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[styles.btn, isRecording && styles.btnActive, disabled && styles.btnDisabled]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <Text style={styles.icon}>🎤</Text>
        </TouchableOpacity>
      </Animated.View>

      {isRecording && (
        <Text style={styles.hint}>Rilascia per inviare</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: { backgroundColor: colors.error },
  btnDisabled: { opacity: 0.4 },
  icon: { fontSize: 22 },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: spacing.xs,
  },
  timer: { color: colors.error, fontSize: 13, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 11, marginTop: spacing.xs },
});
