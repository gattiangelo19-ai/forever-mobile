import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import api from '../../../src/config/api';
import useChatStore from '../../../src/store/chatStore';
import { connectSocket } from '../../../src/config/socket';
import MessageBubble from '../../../src/components/chat/MessageBubble';
import VoiceRecorder from '../../../src/components/chat/VoiceRecorder';
import { colors, spacing, radius } from '../../../src/constants/theme';

// Emoji picker solo su web
let EmojiPicker = null;
if (Platform.OS === 'web') {
  EmojiPicker = require('emoji-picker-react').default;
}

export default function ChatScreen() {
  const { profileId } = useLocalSearchParams();
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const [text, setText] = useState('');
  const [profile, setProfile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const {
    messages, sessionId, isTyping, isSending,
    initSession, loadMessages, sendTextMessage, sendVoiceMessage,
    addIncomingMessage, setTyping, clear,
  } = useChatStore();

  // Caricamento iniziale
  useEffect(() => {
    let socket;

    const setup = async () => {
      // Carica profilo
      const { data } = await api.get(`/profiles/${profileId}`);
      setProfile(data.data);
      navigation.setOptions({ title: data.data.chatExportName || data.data.name });

      // Inizializza sessione e messaggi
      await initSession(profileId);
      await loadMessages(profileId);

      // WebSocket
      socket = await connectSocket();
      const { sessionId: sid } = useChatStore.getState();
      socket.emit('join_session', sid);
      socket.on('agent_typing', ({ isTyping: t }) => setTyping(t));
      socket.on('new_message', (msg) => addIncomingMessage(msg));
    };

    setup().catch(console.error);

    return () => {
      socket?.off('agent_typing');
      socket?.off('new_message');
      clear();
    };
  }, [profileId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');

    // Aggiunge subito il messaggio utente nella lista (ottimistic update)
    addIncomingMessage({
      id: `tmp_${Date.now()}`,
      role: 'USER',
      type: 'TEXT',
      content: trimmed,
      createdAt: new Date().toISOString(),
    });

    await sendTextMessage(profileId, trimmed);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [text, isSending, profileId]);

  const handleVoice = useCallback(async (uri) => {
    addIncomingMessage({
      id: `tmp_${Date.now()}`,
      role: 'USER',
      type: 'VOICE',
      content: '🎤 Messaggio vocale',
      createdAt: new Date().toISOString(),
    });
    await sendVoiceMessage(profileId, uri);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [profileId]);

  const renderMessage = useCallback(
    ({ item }) => <MessageBubble message={item} />,
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header profilo */}
      {profile && (
        <View style={styles.profileHeader}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.profileName}>{profile.chatExportName || `${profile.name} ${profile.surname}`}</Text>
            <Text style={styles.profileStatus}>
              {isTyping ? '✍️ sta scrivendo...' : '● Online'}
            </Text>
          </View>
        </View>
      )}

      {/* Lista messaggi — inverted: i nuovi in basso */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingDots}>• • •</Text>
          </View>
        </View>
      )}

      {/* Emoji picker (solo web) */}
      {Platform.OS === 'web' && showEmojiPicker && EmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setText((prev) => prev + emojiData.emoji);
              setShowEmojiPicker(false);
            }}
            theme="dark"
            height={350}
            width="100%"
            searchPlaceholder="Cerca emoji..."
          />
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.emojiBtn}
            onPress={() => setShowEmojiPicker((v) => !v)}
          >
            <Text style={styles.emojiBtnText}>😊</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Scrivi un messaggio..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
          returnKeyType="default"
          onFocus={() => setShowEmojiPicker(false)}
        />

        {text.trim().length > 0 ? (
          <TouchableOpacity
            style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        ) : (
          <VoiceRecorder onRecordingComplete={handleVoice} disabled={isSending} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  profileAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { color: colors.white, fontWeight: '700', fontSize: 16 },
  profileName: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  profileStatus: { color: colors.success, fontSize: 12, marginTop: 2 },

  messageList: { paddingHorizontal: spacing.xs, paddingVertical: spacing.md },

  typingRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  typingBubble: {
    backgroundColor: colors.bubbleAgent,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingDots: { color: colors.textSecondary, fontSize: 18, letterSpacing: 2 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    color: colors.textPrimary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendIcon: { color: colors.white, fontSize: 16, fontWeight: '700' },

  emojiBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBtnText: { fontSize: 22 },
  emojiPickerContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
