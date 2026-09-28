"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/components/modals/settings/settings-modal";
import { NativeDropdownMenu } from "@/components/ui/native-dropdown-menu";
import { ChatActivityHeatmap } from "@/components/modals/settings/chat-activity";
import {
  getAccentColor,
  getContrastMode,
  getDictationEnabled,
  getLanguagePref,
  setAccentColor,
  setContrastMode,
  setDictationEnabled,
  setLanguagePref,
  type AccentColor,
  type ContrastMode,
} from "@/lib/user-preferences";

export function GeneralPanel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contrast, setContrast] = useState<ContrastMode>("system");
  const [accent, setAccent] = useState<AccentColor>("white");
  const [language, setLanguage] = useState("auto");
  const [dictation, setDictation] = useState(true);

  useEffect(() => {
    setMounted(true);
    setContrast(getContrastMode());
    setAccent(getAccentColor());
    setLanguage(getLanguagePref());
    setDictation(getDictationEnabled());
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border/80 last:border-0 flex items-center justify-between"
          >
            <div className="h-4 w-28 rounded-md bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
            <div className="h-4 w-16 rounded-md bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <SettingsRow label="Appearance">
        <NativeDropdownMenu
          ariaLabel="Appearance"
          value={(theme as "system" | "light" | "dark") || "system"}
          onChange={(value) => setTheme(value)}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Contrast">
        <NativeDropdownMenu
          ariaLabel="Contrast"
          value={contrast}
          onChange={(value) => {
            setContrast(value);
            setContrastMode(value);
          }}
          options={[
            { value: "system", label: "System" },
            { value: "less", label: "Less" },
            { value: "more", label: "More" },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Accent color">
        <NativeDropdownMenu
          ariaLabel="Accent color"
          value={accent}
          onChange={(value) => {
            setAccent(value);
            setAccentColor(value);
          }}
          options={[
            { value: "white", label: "White" },
            { value: "blue", label: "Blue" },
            { value: "green", label: "Green" },
            { value: "purple", label: "Purple" },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Language">
        <NativeDropdownMenu
          ariaLabel="Language"
          value={language}
          onChange={(value) => {
            setLanguage(value);
            setLanguagePref(value);
          }}
          options={[
            { value: "auto", label: "Auto-detect" },
            { value: "ar", label: "Arabic" },
            { value: "zh", label: "Chinese" },
            { value: "en", label: "English" },
            { value: "fr", label: "French" },
            { value: "de", label: "German" },
            { value: "gu", label: "Gujarati" },
            { value: "hi", label: "Hindi" },
            { value: "it", label: "Italian" },
            { value: "ja", label: "Japanese" },
            { value: "pt", label: "Portuguese" },
            { value: "es", label: "Spanish" },
          ]}
        />
      </SettingsRow>

      <SettingsRow
        label="Enable Dictation"
        description="Use dictation in the chat composer."
      >
        <Switch
          checked={dictation}
          onCheckedChange={(checked) => {
            setDictation(checked);
            setDictationEnabled(checked);
          }}
        />
      </SettingsRow>
    </div>
  );
}
