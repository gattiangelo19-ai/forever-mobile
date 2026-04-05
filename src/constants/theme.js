export const colors = {
  // Palette principale — viola scuro/notturno, evoca intimità e memoria
  primary: '#7C5CBF',
  primaryDark: '#5A3D9A',
  primaryLight: '#A07FD4',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  border: '#2E2E4A',

  // Testo
  textPrimary: '#F0EDF8',
  textSecondary: '#9A96B0',
  textMuted: '#5A5870',

  // Chat bubbles
  bubbleUser: '#7C5CBF',
  bubbleAgent: '#1E1E35',
  bubbleUserText: '#FFFFFF',
  bubbleAgentText: '#F0EDF8',

  // Stato
  success: '#4CAF82',
  error: '#E05C6A',
  warning: '#F0A050',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};

const EMOJI_FONT = "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', system-ui, sans-serif";

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, fontFamily: EMOJI_FONT },
  h2: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, fontFamily: EMOJI_FONT },
  h3: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, fontFamily: EMOJI_FONT },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary, fontFamily: EMOJI_FONT },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textSecondary, fontFamily: EMOJI_FONT },
};
