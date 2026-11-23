"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
export function WebsiteTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (value: Theme) => {
      document.documentElement.dataset.theme = value;
      setTheme(value);
    };
    const read = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("website-theme");
      } catch {}
      apply(
        stored === "light" || stored === "dark"
          ? stored
          : media.matches
            ? "dark"
            : "light",
      );
    };
    read();
    media.addEventListener("change", read);
    window.addEventListener("storage", read);
    return () => {
      media.removeEventListener("change", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("website-theme", next);
    } catch {}
  };
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeContext.Provider>
  );
}
export const useWebsiteTheme = () => useContext(ThemeContext);
