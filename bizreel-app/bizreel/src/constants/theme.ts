/**
 * THEME — single source of truth for all design tokens.
 * Aligned with BizReels Web Bento Light Theme (#FAF6F1 background, #FFFFFF cards, #E3DCCB borders, #C8860A gold accents).
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Brand colors — Aligned 100% with Web Theme
// ---------------------------------------------------------------------------
export const BrandColors = {
  /** Primary gold — buttons, highlights, links */
  primary: '#C8860A',
  /** Lighter gold — hover / pressed state */
  primaryLight: '#E0A030',
  /** Darker gold — active / focus state */
  primaryDark: '#9E6A08',
  /** Primary text on gold background */
  onPrimary: '#FFFFFF',
  /** App background warm cream tint (Light Bento Theme) */
  warmBackground: '#FAF6F1',
  /** Card element background */
  cardBackground: '#FFFFFF',
  /** Soft border color */
  border: '#E3DCCB',
  /** Input field background */
  inputBackground: '#FFFFFF',
  /** Placeholder text color */
  placeholder: '#888888',
  /** Success green */
  success: '#22C55E',
  /** Error red */
  error: '#EF4444',
  /** Warning amber */
  warning: '#F59E0B',
} as const;

// ---------------------------------------------------------------------------
// Adaptive palette — Web-Aligned Light UI Theme
// ---------------------------------------------------------------------------
export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#FAF6F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0E8DE',
    border: '#E3DCCB',
    inputBackground: '#FFFFFF',
    placeholder: '#888888',
  },
  dark: {
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#FAF6F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0E8DE',
    border: '#E3DCCB',
    inputBackground: '#FFFFFF',
    placeholder: '#888888',
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
export const BottomTabInset = 80;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------
export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
