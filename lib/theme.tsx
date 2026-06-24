import { createContext, useContext, type ReactNode } from "react";

export type ThemeColors = Record<string, string>;

type ThemeContextValue = {
  colors: ThemeColors;
  gradient: readonly [string, string];
  gradientAccent: readonly [string, string];
};

const COLORS: ThemeColors = {
  bg: "#0A0A0A",
  card: "#141414",
  cardSolid: "#141414",
  cardGlass: "rgba(20, 20, 20, 0.9)",
  input: "#1A1A1A",
  border: "#222222",
  text: "#F0F0F0",
  textSecondary: "#999999",
  muted: "#666666",
  headerBg: "#0A0A0A",
  headerTint: "#8B6B4A",
  accent: "#8B6B4A",
  accentDark: "#6B5038",
  accentLight: "rgba(139, 107, 74, 0.1)",
  errorBorder: "#E85D5D",
  errorBg: "rgba(232, 93, 93, 0.1)",
  errorText: "#E85D5D",
  greenBg: "rgba(100, 200, 120, 0.1)",
  greenText: "#64C878",
  redBg: "rgba(232, 93, 93, 0.1)",
  redText: "#E85D5D",
  shadow: "rgba(0, 0, 0, 0.6)",
  menuOverlay: "rgba(0, 0, 0, 0.75)",
  skeleton: "rgba(139, 107, 74, 0.1)",
  skeletonHighlight: "rgba(139, 107, 74, 0.2)",
  pinnedBg: "rgba(139, 107, 74, 0.08)",
};

const GRADIENT: readonly [string, string] = ["#8B6B4A", "#5A4530"];
const GRADIENT_ACCENT: readonly [string, string] = ["#A88060", "#8B6B4A"];

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
