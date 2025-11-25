import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * Responsive width based on screen size
 * @param size - Size value from design (based on BASE_WIDTH)
 * @returns Scaled width
 */
export function rw(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Responsive height based on screen size
 * @param size - Size value from design (based on BASE_HEIGHT)
 * @returns Scaled height
 */
export function rh(size: number): number {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Responsive font size - scales with screen width but caps at reasonable limits
 * @param size - Base font size
 * @returns Scaled font size
 */
export function rf(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;

  // Normalize for pixel density
  const normalized = Math.round(PixelRatio.roundToNearestPixel(newSize));

  // Cap scaling to prevent too large or too small text
  const minScale = 0.85; // Don't scale down more than 15%
  const maxScale = 1.15; // Don't scale up more than 15%

  if (scale < minScale) {
    return Math.round(size * minScale);
  }
  if (scale > maxScale) {
    return Math.round(size * maxScale);
  }

  return normalized;
}

/**
 * Responsive spacing - scales with screen size
 * @param size - Base spacing size
 * @returns Scaled spacing
 */
export function rs(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/**
 * Check if device is a small screen (< 375px width)
 */
export function isSmallDevice(): boolean {
  return SCREEN_WIDTH < 375;
}

/**
 * Check if device is a tablet (> 768px width)
 */
export function isTablet(): boolean {
  return SCREEN_WIDTH >= 768;
}

/**
 * Get responsive typography styles
 * Applies appropriate scaling for current device
 */
export const responsiveTypography = {
  // Display styles
  heroTitle: {
    fontSize: rf(isSmallDevice() ? 48 : isTablet() ? 72 : 64),
    lineHeight: rf(isSmallDevice() ? 52 : isTablet() ? 78 : 70),
  },
  pageTitle: {
    fontSize: rf(isSmallDevice() ? 36 : isTablet() ? 56 : 48),
    lineHeight: rf(isSmallDevice() ? 42 : isTablet() ? 62 : 54),
  },
  sectionTitle: {
    fontSize: rf(isSmallDevice() ? 28 : isTablet() ? 42 : 36),
    lineHeight: rf(isSmallDevice() ? 34 : isTablet() ? 48 : 42),
  },
  cardTitle: {
    fontSize: rf(isSmallDevice() ? 20 : isTablet() ? 28 : 24),
    lineHeight: rf(isSmallDevice() ? 26 : isTablet() ? 34 : 30),
  },

  // Body styles
  bodyLarge: {
    fontSize: rf(isSmallDevice() ? 18 : 20),
    lineHeight: rf(isSmallDevice() ? 26 : 30),
  },
  body: {
    fontSize: rf(isSmallDevice() ? 16 : 18),
    lineHeight: rf(isSmallDevice() ? 24 : 28),
  },
  bodySmall: {
    fontSize: rf(isSmallDevice() ? 13 : 14),
    lineHeight: rf(isSmallDevice() ? 18 : 20),
  },

  // Accent styles
  label: {
    fontSize: rf(isSmallDevice() ? 12 : 14),
    lineHeight: rf(isSmallDevice() ? 16 : 18),
  },
  button: {
    fontSize: rf(isSmallDevice() ? 14 : 16),
    lineHeight: rf(isSmallDevice() ? 18 : 20),
  },
  caption: {
    fontSize: rf(isSmallDevice() ? 13 : 14),
    lineHeight: rf(isSmallDevice() ? 18 : 20),
  },
  finePrint: {
    fontSize: rf(isSmallDevice() ? 10 : 11),
    lineHeight: rf(isSmallDevice() ? 14 : 15),
  },
};

/**
 * Get responsive spacing values
 */
export const responsiveSpacing = {
  xs: rs(4),
  sm: rs(8),
  md: rs(16),
  lg: rs(24),
  xl: rs(32),
  '2xl': rs(48),
  '3xl': rs(64),
};

/**
 * Screen dimensions for conditional rendering
 */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice(),
  isTablet: isTablet(),
};
