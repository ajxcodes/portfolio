"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { useTrafficTracker } from "@/hooks/useTrafficTracker";

function TrafficTracker() {
  useTrafficTracker();
  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <TrafficTracker />
      {children}
    </NextThemesProvider>
  );
}
