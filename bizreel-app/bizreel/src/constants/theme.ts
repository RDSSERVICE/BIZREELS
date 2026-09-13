/**
 * THEME — single source of truth for all design tokens.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Brand colors — Matte Finish Warm Bento Theme
// ---------------------------------------------------------------------------
export const BrandColors = {
  /** Primary gold — buttons, highlights, links */
  primary: '#F59E0B',
  /** Lighter gold — hover / pressed state */
  primaryLight: '#FBBF24',
  /** Darker gold — active / focus state */
  primaryDark: '#D97706',
  /** Primary text on gold background */
  onPrimary: '#1E1B18',
  /** App background warm matte texture tint */
  warmBackground: '#F6F4EE',
  /** Card background warm matte finish */
  cardBackground: '#FBF9F5',
  /** Tactile divider / border color */
  border: '#E5E0D4',
  /** Input field matte background */
  inputBackground: '#F0EDE4',
  /** Placeholder text */
  placeholder: 'rgba(30,27,24,0.45)',
  /** Success green */
  success: '#10B981',
  /** Error red */
  error: '#EF4444',
  /** Warning amber */
  warning: '#F59E0B',
} as const;

// ---------------------------------------------------------------------------
// Adaptive palette
// ---------------------------------------------------------------------------
export const Colors = {
  light: {
    text: '#1E1B18',
    textSecondary: '#6E675F',
    background: '#F6F4EE',
    backgroundElement: '#FBF9F5',
    backgroundSelected: '#F0EDE4',
    border: '#E5E0D4',
    inputBackground: '#F0EDE4',
    placeholder: '#8C857B',
  },
  dark: {
    text: '#1E1B18',
    textSecondary: '#6E675F',
    background: '#F6F4EE',
    backgroundElement: '#FBF9F5',
    backgroundSelected: '#F0EDE4',
    border: '#E5E0D4',
    inputBackground: '#F0EDE4',
    placeholder: '#8C857B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ---------------------------------------------------------------------------
// Spacing scale (4px grid)
// ---------------------------------------------------------------------------
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
  ten: 40,
  twelve: 48,
} as const;

export const MaxContentWidth = 1200;
export const BottomTabInset = 64;

// ---------------------------------------------------------------------------
// Border radius — Bento Grid Soft Rounded Tokens
// ---------------------------------------------------------------------------
export const Radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Bento Grid Shadows & Elevation
// ---------------------------------------------------------------------------
export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

