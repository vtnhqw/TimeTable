"use client";
import { CalendarDays, RotateCcw, Sun, Moon } from "lucide-react";
import { useWebsiteTheme } from "./WebsiteTheme";
export function Navbar({
  onReset,
  hasData,
}: {
  onReset: () => void;
  hasData: boolean;
}) {
  const { theme, toggle } = useWebsiteTheme();
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand" aria-label="Timetable home">
          <span className="brand-mark">
            <CalendarDays size={21} />
          </span>
          Timetable<span className="brand-secondary">Wallpaper studio</span>
        </a>
        <div className="header-actions">
          {hasData && (
            <button
              className="icon-button reset-button"
              onClick={onReset}
              aria-label="Start over"
              title="Start over"
            >
              <RotateCcw size={19} />
            </button>
          )}
          <button
            className="icon-button theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
