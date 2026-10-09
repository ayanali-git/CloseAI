"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/components/modals/settings/settings-modal";
import { NativeDropdownMenu } from "@/components/ui/native-dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  getAccentColor,
  getContrastMode,
  getDictationEnabled,
  getLanguagePref,
  setAccentColor,
  setContrastMode,
  setDictationEnabled,
  setLanguagePref,
  PREFERENCE_EVENT,
  type AccentColor,
  type ContrastMode,
} from "@/lib/user-preferences";
import languagesData from "@/data/languages.json";
import type { DropdownOption } from "@/components/ui/native-dropdown-menu";

interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
}

const languages = languagesData as LanguageItem[];
const hindi = languages.find((l) => l.code === "hi-IN" || l.code === "hi" || l.name.startsWith("Hindi"));
const gujarati = languages.find((l) => l.code === "gu-IN" || l.code === "gu" || l.name.startsWith("Gujarati"));

const languageOptions: DropdownOption[] = [
  { value: "auto", label: "Auto-detect" },
  ...(hindi ? [{ value: hindi.code, label: hindi.name }] : []),
  ...(gujarati ? [{ value: gujarati.code, label: gujarati.name, divider: true }] : []),
  ...languages
    .filter(
      (l) =>
        (!hindi || l.code !== hindi.code) &&
        (!gujarati || l.code !== gujarati.code)
    )
    .map((l) => ({
      value: l.code,
      label: l.name,
    })),
];

export function GeneralPanel() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  // Contrast and Dictation are for signed-in users only.
  // Appearance, Accent color, and Language are available for all users (including guests).
  // Using `Boolean(user)` (instead of `!isGuest`) means these rows never
  // flash on screen while auth is still loading.
  const isAuthed = Boolean(user);

  const [mounted, setMounted] = useState(false);
  const [contrast, setContrast] = useState<ContrastMode>("system");
  const [accent, setAccent] = useState<AccentColor>("white");
  const [language, setLanguage] = useState("auto");
  const [dictation, setDictation] = useState(true);

  useEffect(() => {
    setMounted(true);
    const syncPrefs = () => {
      setContrast(getContrastMode());
      setAccent(getAccentColor());
      setLanguage(getLanguagePref());
      setDictation(getDictationEnabled());
    };
    syncPrefs();
    window.addEventListener(PREFERENCE_EVENT, syncPrefs);
    return () => window.removeEventListener(PREFERENCE_EVENT, syncPrefs);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-1">
        {/* Guests see 3 rows (Appearance, Accent color, Language); signed-in users see 5 */}
        {Array.from({ length: isAuthed ? 5 : 3 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border/80 last:border-0 flex items-center justify-between"
          >
            <div className="h-4 w-28 rounded-2xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
            <div className="h-4 w-16 rounded-2xl bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
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

      {isAuthed ? (
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
      ) : null}

      <SettingsRow label="Accent color">
        <NativeDropdownMenu
          ariaLabel="Accent color"
          value={accent}
          onChange={(value) => {
            setAccent(value);
            setAccentColor(value);
          }}
          options={[
            { value: "white", label: "Default" },
            { value: "blue", label: "Blue" },
            { value: "green", label: "Green" },
            { value: "purple", label: "Purple" },
            { value: "yellow", label: "Yellow" },
            { value: "pink", label: "Pink" },
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
          options={languageOptions}
          contentClassName="min-w-[190px]"
        />
      </SettingsRow>

      {isAuthed ? (
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
      ) : null}
    </div>
  );
}