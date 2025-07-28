"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, SystemThemeIcon } from "@/components/icons";

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a skeleton placeholder to prevent layout shift and hydration mismatch
    return (
      <button className="p-2 rounded-full" disabled aria-label="Cycle theme">
        <div className="h-6 w-6" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getNextTheme = () => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-full hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Change theme from ${theme} to ${getNextTheme()}`}
      title={`Change theme to ${getNextTheme()}`}
    >
      <span className="sr-only">Current theme: {theme}</span>
      {/* Show an icon representing the CURRENT theme state */}
      {theme === "light" && <SunIcon className="h-6 w-6" />}
      {theme === "dark" && <MoonIcon className="h-6 w-6" />}
      {theme === "system" && <SystemThemeIcon className="h-6 w-6" />}
    </button>
  );
};
