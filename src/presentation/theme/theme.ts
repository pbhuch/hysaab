export interface ThemeColors {
  primary: string; // Indigo
  secondary: string; // Amber
  accent: string; // Teal
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  info: string;
  warning: string;
}

export const lightTheme: ThemeColors = {
  primary: '#6366f1', // Indigo
  secondary: '#f59e0b', // Amber
  accent: '#14b8a6', // Teal
  background: '#f8fafc', // Slate 50
  card: '#ffffff',
  text: '#0f172a', // Slate 900
  textMuted: '#64748b', // Slate 500
  border: '#e2e8f0', // Slate 200
  success: '#10b981', // Emerald 500
  danger: '#ef4444', // Red 500
  info: '#3b82f6', // Blue 500
  warning: '#f59e0b',
};

export const darkTheme: ThemeColors = {
  primary: '#818cf8', // Light Indigo
  secondary: '#fbbf24', // Light Amber
  accent: '#2dd4bf', // Light Teal
  background: '#0f172a', // Slate 900
  card: '#1e293b', // Slate 800
  text: '#f8fafc', // Slate 50
  textMuted: '#94a3b8', // Slate 400
  border: '#334155', // Slate 700
  success: '#34d399', // Emerald 400
  danger: '#f87171', // Red 400
  info: '#60a5fa', // Blue 400
  warning: '#fbbf24',
};

export const typography = {
  fontFamily: 'System',
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  }
};
