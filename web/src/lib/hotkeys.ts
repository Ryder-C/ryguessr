import { useSettingsState } from "@/store/useSettingsStore";

/** True when a game hotkey should be ignored: the user is typing or settings are open. */
export function shouldIgnoreHotkey(e: KeyboardEvent): boolean {
  if (useSettingsState.getState().settingsVisibility) return true;
  const target = e.target as HTMLElement | null;
  return !!target?.closest("input, textarea, [contenteditable]");
}

export const isConfirmKey = (e: KeyboardEvent) =>
  e.key === " " || e.key === "Enter";
