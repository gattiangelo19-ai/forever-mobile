import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import AudioPlayer from './AudioPlayer';
import { colors, spacing, radius, typography } from '../../constants/theme';

export default function MessageBubble({ message }) {
  const isUser = message.user._id === 'user';
  const { messageType, text, audioUrl, imageUrl, createdAt } = message;

  const time = new Date(createdAt).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAgent,
      ]}>
        {messageType === 'TEXT' && (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
            {text}
          </Text>
        )}

        {messageType === 'VOICE' && audioUrl && (
          <AudioPlayer uri={audioUrl} isUserMessage={isUser} />
        )}

        {messageType === 'IMAGE' && imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAgent]}>
          {time}
          {isUser && '  ✓✓'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 2, paddingHorizontal: spacing.md },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.bubbleUser,
    borderBottomRightRadius: 4,
  },
  bubbleAgent: {
    backgroundColor: colors.bubbleAgent,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  text: { ...typography.body, lineHeight: 22 },
  textUser: { color: colors.bubbleUserText },
  textAgent: { color: colors.bubbleAgentText },

  image: {
    width: 220,
    height: 220,
    borderRadius: radius.md,
  },

  time: { fontSize: 10, marginTop: 4 },
  timeUser: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
  timeAgent: { color: colors.textMuted },
});
