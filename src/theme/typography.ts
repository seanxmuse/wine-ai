// Luxury Typography System
// Playfair Display (dramatic serif) + Crimson Pro (elegant serif)
// High contrast weights: 200/300 vs 700/800

export const typography = {
  // Font Families
  fonts: {
    display: 'PlayfairDisplay_800ExtraBold',      // Dramatic headings
    displayLight: 'PlayfairDisplay_400Regular',   // Subheadings
    body: 'CrimsonPro_400Regular',                // Body text
    bodyMedium: 'CrimsonPro_500Medium',           // Emphasis
    bodySemibold: 'CrimsonPro_600SemiBold',       // Strong emphasis
    bodyBold: 'CrimsonPro_700Bold',               // Very strong
    light: 'CrimsonPro_200ExtraLight',            // Delicate text
  },

  // Font Sizes (extreme jumps: 3x+ ratios)
  sizes: {
    xs: 11,      // Fine print
    sm: 14,      // Small body
    base: 18,    // Base body (larger for luxury feel)
    lg: 24,      // Large text
    xl: 36,      // Section headings (3x xs)
    '2xl': 48,   // Page headings (4x xs)
    '3xl': 64,   // Hero text (6x xs)
    '4xl': 96,   // Massive display
  },

  // Line Heights
  lineHeights: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.7,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,   // For luxury all-caps headings
  },

  // Font Weights
  weights: {
    extraLight: '200' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
    black: '900' as const,
  },

  // Predefined Text Styles
  styles: {
    // Display styles (Playfair)
    heroTitle: {
      fontFamily: 'PlayfairDisplay_800ExtraBold',
      fontSize: 64,
      lineHeight: 1.1,
      letterSpacing: -0.025,
    },
    pageTitle: {
      fontFamily: 'PlayfairDisplay_800ExtraBold',
      fontSize: 48,
      lineHeight: 1.2,
      letterSpacing: -0.02,
    },
    sectionTitle: {
      fontFamily: 'PlayfairDisplay_800ExtraBold',
      fontSize: 36,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    cardTitle: {
      fontFamily: 'PlayfairDisplay_400Regular',
      fontSize: 24,
      lineHeight: 1.4,
      letterSpacing: 0,
    },

    // Body styles (Crimson Pro)
    bodyLarge: {
      fontFamily: 'CrimsonPro_400Regular',
      fontSize: 20,
      lineHeight: 1.6,
      letterSpacing: 0,
    },
    body: {
      fontFamily: 'CrimsonPro_400Regular',
      fontSize: 18,
      lineHeight: 1.6,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: 'CrimsonPro_400Regular',
      fontSize: 14,
      lineHeight: 1.5,
      letterSpacing: 0,
    },

    // Accent styles
    label: {
      fontFamily: 'CrimsonPro_600SemiBold',
      fontSize: 14,
      lineHeight: 1.4,
      letterSpacing: 0.05,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontFamily: 'CrimsonPro_600SemiBold',
      fontSize: 16,
      lineHeight: 1.2,
      letterSpacing: 0.05,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontFamily: 'CrimsonPro_200ExtraLight',
      fontSize: 14,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    finePrint: {
      fontFamily: 'CrimsonPro_200ExtraLight',
      fontSize: 11,
      lineHeight: 1.3,
      letterSpacing: 0.025,
    },
  },
};

export type Typography = typeof typography;
