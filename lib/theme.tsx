import { createContext, useContext, type ReactNode } from "react";

export type ThemeColors = Record<string, string>;

type ThemeContextValue = {
  colors: ThemeColors;
  gradient: readonly [string, string];
  gradientAccent: readonly [string, string];
};

const COLORS: ThemeColors = {
  bg: "#1E2030",
  card: "#262838",
  cardSolid: "#262838",
  cardGlass: "rgba(38, 40, 56, 0.9)",
  input: "#2E3045",
  border: "#363B4E",
  text: "#F0EEFF",
  textSecondary: "#C4BBF0",
  muted: "#6B6E82",
  headerBg: "#1E2030",
  headerTint: "#927FBF",
  accent: "#5C4A8C",
  accentDark: "#4A3A70",
  accentLight: "rgba(79, 59, 120, 0.2)",
  errorBorder: "#E85D5D",
  errorBg: "rgba(232, 93, 93, 0.1)",
  errorText: "#E85D5D",
  greenBg: "rgba(100, 200, 120, 0.15)",
  greenText: "#64C878",
  redBg: "rgba(232, 93, 93, 0.1)",
  redText: "#E85D5D",
  shadow: "rgba(0, 0, 0, 0.7)",
  menuOverlay: "rgba(0, 0, 0, 0.8)",
  skeleton: "rgba(79, 59, 120, 0.1)",
  skeletonHighlight: "rgba(79, 59, 120, 0.2)",
  pinnedBg: "rgba(196, 187, 240, 0.1)",
  onlineGreen: "#64C878",
  toolTest: "#64C878",
  toolPdf: "#E85D5D",
  toolFlashcards: "#C4BBF0",
  toolExplain: "#927FBF",
  toolBg: "rgba(92, 74, 140, 0.3)",
  white: "#F0EEFF",
  avatarFallback: "#4F3B78",
};

const GRADIENT: readonly [string, string] = ["#5C4A8C", "#4A3A70"];
const GRADIENT_ACCENT: readonly [string, string] = ["#927FBF", "#5C4A8C"];

const ThemeContext = createContext<ThemeContextValue>({
  colors: COLORS,
  gradient: GRADIENT,
  gradientAccent: GRADIENT_ACCENT,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors: COLORS, gradient: GRADIENT, gradientAccent: GRADIENT_ACCENT }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
