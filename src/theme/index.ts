import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { responsiveTypography, responsiveSpacing, rf, rw, rh, rs, screen } from '../utils/responsive';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  // Responsive utilities
  responsive: {
    typography: responsiveTypography,
    spacing: responsiveSpacing,
    font: rf,
    width: rw,
    height: rh,
    space: rs,
  },
  screen,
};

export type Theme = typeof theme;
export { colors, typography, spacing, borderRadius, shadows, rf, rw, rh, rs, responsiveTypography, responsiveSpacing, screen };
