/**
 * Helper utility for managing Temporary Chats in CloseAI.
 * Uses consistent cookie logic matching the CloseAI project (like archived_chats).
 * No local or session storage.
 */

const COOKIE_NAME = "temporary_chats";

/**
 * Returns the set of all active temporary chat IDs from cookies.
 */
export function getTemporaryChatIds(): Set<string> {
  const ids = new Set<string>();
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      decoded
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((id) => ids.add(id));
    }
  }
  return ids;
}

/**
 * Checks if a specific chat ID is marked as temporary in cookies.
 */
export function isTemporaryChat(chatId: string | null | undefined): boolean {
  if (!chatId) return false;
  return getTemporaryChatIds().has(chatId);
}

/**
 * Adds a chat ID to temporary_chats cookie.
 */
export function addTemporaryChat(chatId: string): void {
  if (!chatId || typeof document === "undefined") return;
  const currentIds = Array.from(getTemporaryChatIds());
  const updatedSet = new Set(currentIds);
  updatedSet.add(chatId);
  const cookieValue = Array.from(updatedSet).join(",");
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    cookieValue
  )}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Removes a chat ID from temporary_chats cookie (e.g. when saving to history).
 */
export function removeTemporaryChat(chatId: string): void {
  if (!chatId || typeof document === "undefined") return;
  const currentIds = Array.from(getTemporaryChatIds());
  const updatedSet = new Set(currentIds);
  updatedSet.delete(chatId);
  const cookieValue = Array.from(updatedSet).join(",");
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    cookieValue
  )}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Checks if the current search parameters indicate temporary chat mode (?tc=true or ?temporary-chat=true).
 */
export function isTemporaryChatParam(
  searchParams: { get: (key: string) => string | null } | null | undefined
): boolean {
  if (!searchParams) return false;
  const tc = searchParams.get("tc");
  if (tc === "true" || tc === "1") return true;
  const tempChat = searchParams.get("temporary-chat");
  if (tempChat === "true" || tempChat === "1") return true;
  return false;
}
