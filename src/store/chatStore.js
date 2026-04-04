import { create } from 'zustand';
import api from '../config/api';

const useChatStore = create((set, get) => ({
  messages: [],
  sessionId: null,
  isTyping: false,
  isSending: false,

  initSession: async (profileId) => {
    const { data } = await api.get(`/chat/${profileId}/session`);
    set({ sessionId: data.data.sessionId, messages: [] });
  },

  loadMessages: async (profileId) => {
    const { data } = await api.get(`/chat/${profileId}/messages?limit=40`);
    // Gifted Chat vuole i messaggi in formato specifico
    const formatted = data.data.map(formatMessage);
    set({ messages: formatted });
  },

  sendTextMessage: async (profileId, text) => {
    const { sessionId } = get();
    set({ isSending: true });
    try {
      const { data } = await api.post(`/chat/${profileId}/message`, {
        sessionId,
        content: text,
      });
      const agentMsg = formatMessage(data.data);
      set((s) => ({ messages: [agentMsg, ...s.messages] }));
    } finally {
      set({ isSending: false });
    }
  },

  sendVoiceMessage: async (profileId, audioUri) => {
    const { sessionId } = get();
    set({ isSending: true });
    try {
      const form = new FormData();
      form.append('audio', {
        uri: audioUri,
        name: 'voice.mp3',
        type: 'audio/mpeg',
      });
      form.append('sessionId', sessionId);

      const { data } = await api.post(`/chat/${profileId}/voice-message`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const agentMsg = formatMessage(data.data.agentMessage);
      set((s) => ({ messages: [agentMsg, ...s.messages] }));
      return data.data.transcription;
    } finally {
      set({ isSending: false });
    }
  },

  // Aggiunge messaggio in arrivo da WebSocket
  addIncomingMessage: (message) => {
    const formatted = formatMessage(message);
    set((s) => ({ messages: [formatted, ...s.messages] }));
  },

  setTyping: (val) => set({ isTyping: val }),

  clear: () => set({ messages: [], sessionId: null, isTyping: false }),
}));

// Converte il formato backend → Gifted Chat
const formatMessage = (msg) => ({
  _id: msg.id,
  text: msg.type === 'TEXT' ? msg.content : msg.content || '',
  createdAt: new Date(msg.createdAt),
  user: {
    _id: msg.role === 'USER' ? 'user' : 'agent',
    name: msg.role === 'AGENT' ? 'ForEver' : 'Tu',
  },
  // Campi extra per tipi speciali
  messageType: msg.type,
  audioUrl: msg.type === 'VOICE' ? msg.mediaUrl : undefined,
  imageUrl: msg.type === 'IMAGE' ? msg.mediaUrl : undefined,
});

export default useChatStore;
