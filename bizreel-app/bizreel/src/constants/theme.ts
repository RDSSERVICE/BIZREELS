/**
 * THEME — single source of truth for all design tokens.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Brand colors — Dark Contrast Theme
// ---------------------------------------------------------------------------
export const BrandColors = {
  /** Primary gold — buttons, highlights, links */
  primary: '#F59E0B',
  /** Lighter gold — hover / pressed state */
  primaryLight: '#FBBF24',
  /** Darker gold — active / focus state */
  primaryDark: '#D97706',
  /** Primary text on gold background */
  onPrimary: '#0F0F12',
  /** App background warm tint */
  warmBackground: '#0F0F12',
  /** Card background */
  cardBackground: '#18181C',
  /** Divider / border color */
  border: '#2D2D36',
  /** Input field background */
  inputBackground: '#18181C',
  /** Placeholder text */
  placeholder: 'rgba(255,255,255,0.4)',
  /** Success green */
  success: '#22C55E',
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
    text: '#F5F5F5',
    textSecondary: '#A0A0A0',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#2A2A2A',
    border: '#2E2E2E',
    inputBackground: '#1E1E1E',
    placeholder: '#555555',
  },
  dark: {
    text: '#F5F5F5',
    textSecondary: '#A0A0A0',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#2A2A2A',
    border: '#2E2E2E',
    inputBackground: '#1E1E1E',
    placeholder: '#555555',
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
