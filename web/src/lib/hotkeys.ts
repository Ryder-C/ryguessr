import { useSettingsState } from "@/store/useSettingsStore";

/** True when a game hotkey should be ignored: the user is typing or settings are open. */
export function shouldIgnoreHotkey(e: KeyboardEvent): boolean {
  if (useSettingsState.getState().settingsVisibility) return true;
  return (
    e.target instanceof Element &&
    !!e.target.closest("input, textarea, [contenteditable]")
  );
}

/** Space or Enter, ignoring auto-repeat so holding a key can't skip through screens. */
export const isConfirmKey = (e: KeyboardEvent) =>
  !e.repeat && (e.key === " " || e.key === "Enter");
