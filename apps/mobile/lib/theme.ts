import type { TextStyle } from "react-native";

/** Mirrors apps/web/app/globals.css tokens */
export const colors = {
  ink: "#14231f",
  inkSoft: "#2a4038",
  paper: "#eef2ec",
  paperDeep: "#dfe7db",
  sheet: "#f7f8f4",
  accent: "#0d6e6e",
  accentDeep: "#0a4f4f",
  warn: "#8a3b2b",
  line: "rgba(20, 35, 31, 0.14)",
  onAccent: "#f4faf8",
  onInk: "#f3f7f4",
  totalsFg: "#edf4f1",
  mutedOnDark: "rgba(237, 244, 241, 0.78)",
  /** Mid stop of the site body gradient */
  bg: "#d5e0d8",
} as const;

/**
 * Web body background layers (globals.css):
 *   radial #c9ddd4 at 10%/-10%, radial #b7cfc8 at 90%/0%,
 *   linear 160deg #e7efe8 → #d5e0d8 45% → #c7d4cd
 */
export const atmosphere = {
  base: ["#e7efe8", "#d5e0d8", "#c7d4cd"] as const,
  mistLeft: "#c9ddd4",
  mistRight: "#b7cfc8",
} as const;

/** Web --shadow on .upload-cta */
export const shadows = {
  cta: {
    shadowColor: "#14231f",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;

/**
 * Web: Fraunces (display) + Source Sans 3 (body) via next/font.
 * RN fontFamily must be the loaded weight key from @expo-google-fonts/*.
 */
export const fonts = {
  display: {
    medium: "Fraunces_500Medium",
    semibold: "Fraunces_600SemiBold",
  },
  sans: {
    regular: "SourceSans3_400Regular",
    medium: "SourceSans3_500Medium",
    semibold: "SourceSans3_600SemiBold",
    bold: "SourceSans3_700Bold",
  },
} as const;

export const type = {
  /** .brand-hero — hero product name (web clamp ~3.4–5.4rem; phone ≈ 54) */
  brandHero: {
    fontFamily: fonts.display.semibold,
    fontSize: 54,
    letterSpacing: -2.16,
    lineHeight: 51,
    color: colors.ink,
  } satisfies TextStyle,

  /** .nav-brand / compact brand mark */
  brandNav: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    letterSpacing: -0.5,
    color: colors.ink,
  } satisfies TextStyle,

  /** .brand-mark — editor top */
  brandMark: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    letterSpacing: -0.7,
    color: colors.ink,
  } satisfies TextStyle,

  /** Auth / mid-size brand */
  brandAuth: {
    fontFamily: fonts.display.semibold,
    fontSize: 28,
    letterSpacing: -0.9,
    color: colors.ink,
  } satisfies TextStyle,

  /** .home-hero h1 */
  headline: {
    fontFamily: fonts.display.medium,
    fontSize: 22,
    lineHeight: 28,
    color: colors.inkSoft,
  } satisfies TextStyle,

  /** .auth-card h1 / form titles */
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 26,
    letterSpacing: -0.4,
    color: colors.ink,
  } satisfies TextStyle,

  /** .history-hero h1 */
  pageTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: colors.ink,
  } satisfies TextStyle,

  /** .people-block h2 */
  section: {
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: colors.ink,
  } satisfies TextStyle,

  /** Totals grand total */
  displayEmphasize: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.totalsFg,
  } satisfies TextStyle,

  /** .lede + body copy */
  body: {
    fontFamily: fonts.sans.regular,
    fontSize: 17,
    lineHeight: 25,
    color: colors.inkSoft,
  } satisfies TextStyle,

  bodySm: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
  } satisfies TextStyle,

  label: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.inkSoft,
  } satisfies TextStyle,

  /** .sheet-meta label */
  metaLabel: {
    fontFamily: fonts.sans.semibold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.inkSoft,
  } satisfies TextStyle,

  /** .upload-cta-label */
  ctaLabel: {
    fontFamily: fonts.sans.bold,
    fontSize: 18,
    color: colors.onAccent,
  } satisfies TextStyle,

  ctaHint: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: "rgba(244,250,248,0.82)",
  } satisfies TextStyle,

  button: {
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    color: colors.ink,
  } satisfies TextStyle,

  buttonOnInk: {
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    color: colors.onInk,
  } satisfies TextStyle,

  input: {
    fontFamily: fonts.sans.regular,
    fontSize: 16,
    color: colors.ink,
  } satisfies TextStyle,

  muted: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.inkSoft,
  } satisfies TextStyle,

  error: {
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    color: colors.warn,
  } satisfies TextStyle,

  strong: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    color: colors.ink,
  } satisfies TextStyle,

  accentStrong: {
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    color: colors.accentDeep,
  } satisfies TextStyle,
} as const;
