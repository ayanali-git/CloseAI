export const PREFERENCE_EVENT = "closeai-preferences";

const KEYS = {
  dictation: "closeai-dictation",
  contrast: "closeai-contrast",
  language: "closeai-language",
  accent: "closeai-accent",
  personalization: "closeai-personalization",
  notifications: "closeai-notifications",
} as const;

export type AccentColor = "white" | "blue" | "green" | "purple" | "yellow" | "pink";
export type ContrastMode = "system" | "less" | "more";

export interface PersonalizationPrefs {
  nickname: string;
  occupation: string;
  customInstructions: string;
  enableMemory: boolean;
}

export interface NotificationPrefs {
  emailNotifications: boolean;
  marketingEmails: boolean;
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PREFERENCE_EVENT));
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
    emit();
  } catch {
    /* ignore quota */
  }
}

export function getDictationEnabled(): boolean {
  return read(KEYS.dictation) !== "false";
}

export function setDictationEnabled(enabled: boolean) {
  write(KEYS.dictation, enabled ? "true" : "false");
}

export function getContrastMode(): ContrastMode {
  const val = read(KEYS.contrast);
  if (val === "more") return "more";
  if (val === "less") return "less";
  return "system";
}

export function setContrastMode(mode: ContrastMode) {
  write(KEYS.contrast, mode);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("contrast-more", mode === "more");
    document.documentElement.classList.toggle("contrast-less", mode === "less");
  }
}

export function getLanguagePref(): string {
  return read(KEYS.language) || "auto";
}

export function setLanguagePref(lang: string) {
  write(KEYS.language, lang);
}

export function getAccentColor(): AccentColor {
  const value = read(KEYS.accent);
  if (
    value === "blue" ||
    value === "green" ||
    value === "purple" ||
    value === "yellow" ||
    value === "pink" ||
    value === "white"
  ) {
    return value;
  }
  return "white";
}

export function setAccentColor(color: AccentColor) {
  write(KEYS.accent, color);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.accent = color;
  }
}

export function getPersonalization(): PersonalizationPrefs {
  const raw = read(KEYS.personalization);
  if (!raw) {
    return {
      nickname: "",
      occupation: "",
      customInstructions: "",
      enableMemory: true,
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersonalizationPrefs>;
    return {
      nickname: parsed.nickname || "",
      occupation: parsed.occupation || "",
      customInstructions: parsed.customInstructions || "",
      enableMemory: parsed.enableMemory !== false,
    };
  } catch {
    return {
      nickname: "",
      occupation: "",
      customInstructions: "",
      enableMemory: true,
    };
  }
}

export function setPersonalization(prefs: PersonalizationPrefs) {
  write(KEYS.personalization, JSON.stringify(prefs));
}

export function getNotificationPrefs(): NotificationPrefs {
  const raw = read(KEYS.notifications);
  if (!raw) {
    return { emailNotifications: true, marketingEmails: false };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      emailNotifications: parsed.emailNotifications !== false,
      marketingEmails: Boolean(parsed.marketingEmails),
    };
  } catch {
    return { emailNotifications: true, marketingEmails: false };
  }
}

export function setNotificationPrefs(prefs: NotificationPrefs) {
  write(KEYS.notifications, JSON.stringify(prefs));
}

export function applyStoredAppearance() {
  if (typeof document === "undefined") return;
  const contrast = getContrastMode();
  document.documentElement.classList.toggle(
    "contrast-more",
    contrast === "more"
  );
  document.documentElement.classList.toggle(
    "contrast-less",
    contrast === "less"
  );
  document.documentElement.dataset.accent = getAccentColor();
}

import languagesData from "@/data/languages.json";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English (India)",
  ...Object.fromEntries(
    (languagesData as Array<{ code: string; name: string }>).map((l) => [l.code, l.name])
  ),
};

export function buildAssistantContext(): string {
  const parts: string[] = [];
  const language = getLanguagePref();
  if (language && language !== "auto") {
    const langName = LANGUAGE_NAMES[language] || language;
    parts.push(`Respond in ${langName}.`);
  }

  const prefs = getPersonalization();
  if (prefs.enableMemory) {
    if (prefs.nickname.trim()) {
      parts.push(`The user's preferred name is "${prefs.nickname.trim()}".`);
    }
    if (prefs.occupation.trim()) {
      parts.push(`The user works as: ${prefs.occupation.trim()}.`);
    }
    if (prefs.customInstructions.trim()) {
      parts.push(
        `Custom instructions from the user:\n${prefs.customInstructions.trim()}`
      );
    }
  }

  return parts.join("\n\n");
}

export function withChatPreferences<T extends Record<string, unknown>>(
  body: T
): T & { assistantContext?: string } {
  const assistantContext = buildAssistantContext();
  if (!assistantContext) return body;
  return { ...body, assistantContext };
}
