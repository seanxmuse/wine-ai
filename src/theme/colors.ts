// Luxury Wine-inspired Color Palette
// Rich, dramatic tones with gold accents for premium feel

export const colors = {
  // Primary - Deep Wine & Burgundy
  primary: {
    50: '#faf5f7',
    100: '#f5e8ed',
    200: '#ead1d9',
    300: '#dab0be',
    400: '#c4889d',
    500: '#a8566e',
    600: '#8b3952',
    700: '#6b2840',
    800: '#4a1c2d',
    900: '#2d111b',
  },

  // Secondary - Gold & Champagne
  gold: {
    50: '#fffef5',
    100: '#fffae0',
    200: '#fff4c2',
    300: '#ffe999',
    400: '#ffd966',
    500: '#d4af37', // Classic gold
    600: '#b8942f',
    700: '#8f7325',
    800: '#6b5519',
    900: '#3d300e',
  },

  // Neutral - Cream, Parchment, Deep Charcoal
  neutral: {
    50: '#fefdfb',   // Cream
    100: '#faf8f4',  // Light parchment
    200: '#f5f2eb',  // Parchment
    300: '#e8e3d8',
    400: '#d1c9b8',
    500: '#a39883',
    600: '#7a6f5d',
    700: '#5a5045',
    800: '#3a342c',
    900: '#1c1915',  // Deep charcoal
  },

  // Accent - Rich Green (wine bottle glass)
  accent: {
    50: '#f4f9f4',
    100: '#e6f2e6',
    200: '#cce5cc',
    300: '#a3d1a3',
    400: '#6fb56f',
    500: '#2d5f2d',
    600: '#234a23',
    700: '#1a371a',
    800: '#122412',
    900: '#0a140a',
  },

  // Semantic Colors
  success: '#2d5f2d',
  warning: '#d4af37',
  error: '#8b3952',
  info: '#6b2840',

  // UI Elements
  background: '#fefdfb',      // Cream background
  surface: '#faf8f4',         // Light parchment cards
  surfaceElevated: '#ffffff', // Pure white for popups
  border: '#e8e3d8',          // Subtle gold-tinted border
  divider: '#f5f2eb',

  // Text
  text: {
    primary: '#1c1915',       // Deep charcoal
    secondary: '#5a5045',     // Medium charcoal
    tertiary: '#a39883',      // Light brown
    inverse: '#fefdfb',       // Cream on dark
    accent: '#8b3952',        // Burgundy for emphasis
    gold: '#d4af37',          // Gold for highlights
  },

  // Overlay
  overlay: 'rgba(28, 25, 21, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
};

export type Colors = typeof colors;
