"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

function isDarkMode(resolvedTheme: string | undefined) {
  if (resolvedTheme === "dark") return true;
  if (resolvedTheme === "light") return false;
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = isDarkMode(resolvedTheme);
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
