import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Colors from ui.md
export const COLORS = {
  primary: '#FF4FA3', // Neon pink
  primaryDark: '#E63E8C',
  primaryLight: '#FF80B3',
  background: '#0F1117',
  surface: '#1A1D26',
  surfaceLight: '#25282F',
  text: '#FFFFFF',
  textSecondary: '#B4B9C4',
  textTertiary: '#8A8F98',
  border: '#2A2D36',
  card: 'rgba(42, 45, 54, 0.8)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: COLORS.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: COLORS.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: COLORS.text,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: COLORS.text,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: COLORS.textTertiary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: COLORS.text,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Common card styles
export const CARD_STYLES = StyleSheet.create({
  glassCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  glassCardLarge: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.large,
  },
  glassCardSmall: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
});

// Button styles
export const BUTTON_STYLES = StyleSheet.create({
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  primaryDisabled: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.5,
  },
  secondary: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ghost: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Input styles
export const INPUT_STYLES = StyleSheet.create({
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body1.fontSize,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
});

// Navigation styles
export const NAV_STYLES = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
  },
  activeTab: {
    backgroundColor: COLORS.surface,
  },
});

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  CARD_STYLES,
  BUTTON_STYLES,
  INPUT_STYLES,
  NAV_STYLES,
};
