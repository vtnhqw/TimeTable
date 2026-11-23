import type { ThemeMode } from "./schema.ts";

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  bgGradient: [string, string, string];
  cardBg: string;
  cardBorder: string;
  gridLineColor: string;
  hourTextColor: string;
  dayHeaderTextColor: string;
  dayHeaderBg: string;
  timeLineColor: string;
  // 12 distinct subject colors
  subjectColors: string[];
}

export const THEMES: Record<ThemeMode, ThemeConfig> = {
  dark: {
    id: "dark",
    name: "Dark Mode",
    bgGradient: ["#0b0d13", "#121824", "#0a0c12"],
    cardBg: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    gridLineColor: "rgba(255, 255, 255, 0.07)",
    hourTextColor: "rgba(255, 255, 255, 0.45)",
    dayHeaderTextColor: "rgba(255, 255, 255, 0.85)",
    dayHeaderBg: "rgba(255, 255, 255, 0.06)",
    timeLineColor: "rgba(255, 255, 255, 0.12)",
    subjectColors: [
      "#3B82F6", // Bright Blue
      "#10B981", // Emerald Green
      "#F59E0B", // Amber Orange
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#06B6D4", // Cyan
      "#EF4444", // Red / Coral
      "#14B8A6", // Teal
      "#F97316", // Bright Orange
      "#A855F7", // Violet
      "#84CC16", // Lime
      "#6366F1", // Indigo
    ],
  },
  light: {
    id: "light",
    name: "Light Mode",
    bgGradient: ["#F8FAFC", "#EEF2F6", "#F1F5F9"],
    cardBg: "rgba(0, 0, 0, 0.02)",
    cardBorder: "rgba(0, 0, 0, 0.06)",
    gridLineColor: "rgba(0, 0, 0, 0.06)",
    hourTextColor: "rgba(0, 0, 0, 0.45)",
    dayHeaderTextColor: "rgba(0, 0, 0, 0.85)",
    dayHeaderBg: "rgba(0, 0, 0, 0.04)",
    timeLineColor: "rgba(0, 0, 0, 0.12)",
    subjectColors: [
      "#2563EB", // Rich Royal Blue
      "#059669", // Jade Green
      "#D97706", // Warm Amber
      "#7C3AED", // Royal Violet
      "#DB2777", // Deep Rose
      "#0891B2", // Deep Cyan
      "#DC2626", // Crimson Red
      "#0D9488", // Deep Teal
      "#EA580C", // Tangerine
      "#9333EA", // Bright Purple
      "#65A30D", // Olive / Lime
      "#4F46E5", // Deep Indigo
    ],
  },
};
