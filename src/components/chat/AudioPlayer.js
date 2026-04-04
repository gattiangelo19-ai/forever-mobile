import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { colors, spacing, radius } from '../../constants/theme';

export default function AudioPlayer({ uri, isUserMessage }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => { sound?.unloadAsync(); };
  }, [sound]);

  const loadAndPlay = useCallback(async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      (status) => {
        if (!status.isLoaded) return;
        setDuration(status.durationMillis || 0);
        setPosition(status.positionMillis || 0);
        if (status.didJustFinish) {
          setIsPlaying(false);
          setPosition(0);
        } else {
          setIsPlaying(status.isPlaying);
        }
      }
    );
    setSound(newSound);
    setIsPlaying(true);
  }, [sound, isPlaying, uri]);

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const bg = isUserMessage ? colors.bubbleUser : colors.bubbleAgent;
  const iconColor = isUserMessage ? colors.white : colors.textPrimary;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={loadAndPlay} style={styles.playBtn}>
        <Text style={[styles.icon, { color: iconColor }]}>
          {isPlaying ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>

      <View style={styles.trackContainer}>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.time, { color: isUserMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
          {formatTime(isPlaying ? position : duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.sm,
    minWidth: 180,
    maxWidth: 260,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: { fontSize: 14 },
  trackContainer: { flex: 1 },
  trackBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 4,
  },
  trackFill: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
  time: { fontSize: 11 },
});
