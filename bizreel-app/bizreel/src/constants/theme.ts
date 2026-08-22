/**
 * THEME — single source of truth for all design tokens.
 *
 * To restyle the whole app, change values here.
 * Components read from this file via useTheme() or direct import.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Brand colors — never change with light/dark mode
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
  /** App background warm tint (light mode) */
  warmBackground: '#FAF6F1',
  /** Divider / border color */
  border: '#E8E0D5',
  /** Input field background */
  inputBackground: '#FFFFFF',
  /** Placeholder text */
  placeholder: '#BBBBBB',
  /** Success green */
  success: '#22C55E',
  /** Error red */
  error: '#EF4444',
  /** Warning amber */
  warning: '#F59E0B',
} as const;

// ---------------------------------------------------------------------------
// Adaptive palette — changes with light/dark scheme
// ---------------------------------------------------------------------------
export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    background: BrandColors.warmBackground,
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0E8DE',
    border: BrandColors.border,
    inputBackground: BrandColors.inputBackground,
    placeholder: BrandColors.placeholder,
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
  '4xl': 40,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ---------------------------------------------------------------------------
// Spacing scale
// ---------------------------------------------------------------------------
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

// ---------------------------------------------------------------------------
// Border radius scale
// ---------------------------------------------------------------------------
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** Fixed content height of the custom tab bar (icon + label + padding), excluding safe area bottom inset */
export const TAB_BAR_HEIGHT = 56;
export const MaxContentWidth = 800;
