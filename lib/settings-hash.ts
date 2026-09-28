export const SETTINGS_SECTIONS = [
  "general",
  "notifications",
  "personalization",
  "profile",
  "plans",
  "account",
  "password",
  "data",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

const SECTION_SET = new Set<string>(SETTINGS_SECTIONS);

export function resolveVisibleSettingsSection(
  parsed: SettingsSection | "root" | null,
  isSectionVisible: (section: SettingsSection) => boolean
): SettingsSection | "root" | null {
  if (!parsed) return null;
  if (parsed === "root") return "root";
  if (isSectionVisible(parsed)) return parsed;
  return "general";
}

export function isSettingsHash(hash: string | null | undefined): boolean {
  if (!hash) return false;
  const clean = decodeURIComponent(hash.replace(/^#/, "")).trim().toLowerCase();
  return clean === "settings" || clean.startsWith("settings/");
}

export function parseSettingsHash(
  hash: string | null | undefined
): SettingsSection | "root" | null {
  if (!hash) return null;
  const clean = decodeURIComponent(hash.replace(/^#/, "")).trim().toLowerCase();
  if (clean === "settings") return "root";
  if (!clean.startsWith("settings/")) return null;
  const rest = clean.slice("settings/".length).split("/")[0];
  if (SECTION_SET.has(rest)) return rest as SettingsSection;
  return "general";
}

export function settingsHashFor(
  section: SettingsSection | "root" = "root"
): string {
  if (section === "root") return "#settings";
  return `#settings/${section}`;
}

export function resolveSettingsSection(
  parsed: SettingsSection | "root" | null
): SettingsSection | null {
  if (!parsed) return null;
  if (parsed === "root") return "general";
  return parsed;
}

export function openSettings(
  section: SettingsSection | "root" = "root"
): void {
  if (typeof window === "undefined") return;
  const nextHash = settingsHashFor(section);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const next = `${window.location.pathname}${window.location.search}${nextHash}`;
  if (current === next) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.history.pushState(null, "", next);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function closeSettings(): void {
  if (typeof window === "undefined") return;
  if (!isSettingsHash(window.location.hash)) return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.history.pushState(null, "", next);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function withCurrentHash(path: string): string {
  if (typeof window === "undefined") return path;
  if (path.includes("#")) return path;
  return `${path}${window.location.hash}`;
}