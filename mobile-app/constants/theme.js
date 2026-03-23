const palette = {
  black: "#0A0A0B",
  charcoal: "#141419",
  slate: "#1E1E26",
  graphite: "#2A2A35",
  steel: "#6B6B80",
  silver: "#9D9DB5",
  cloud: "#C8C8DE",
  white: "#F2F2FA",
  emerald: "#00D68F",
  emeraldDark: "#00B377",
  emeraldMuted: "rgba(0, 214, 143, 0.12)",
  coral: "#FF6B6B",
  coralMuted: "rgba(255, 107, 107, 0.12)",
  amber: "#FFB547",
  amberMuted: "rgba(255, 181, 71, 0.12)",
};

export const colors = {
  bg: palette.black,
  surface: palette.charcoal,
  surfaceElevated: palette.slate,
  border: palette.graphite,
  borderFocused: palette.emerald,
  textPrimary: palette.white,
  textSecondary: palette.silver,
  textMuted: palette.steel,
  accent: palette.emerald,
  accentDark: palette.emeraldDark,
  accentBg: palette.emeraldMuted,
  error: palette.coral,
  errorBg: palette.coralMuted,
  warning: palette.amber,
  warningBg: palette.amberMuted,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  hero: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  small: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
};
