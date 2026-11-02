"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Volume2, UserRound, Users, X } from "lucide-react";
import RoomSettings from "../settings_content/room-settings";
import StreetviewSettings from "../settings_content/streetview-settings";
import UsernameSettings from "../settings_content/username-settings";
import AudioSettings from "../settings_content/audio-settings";

// Zustand
import { settingsStateActions } from "@/store/useSettingsStore";

enum SettingsToggle {
  Room,
  Username,
  Streetview,
  Audio,
}

const TABS = [
  { id: SettingsToggle.Room, label: "Room", icon: Users },
  { id: SettingsToggle.Username, label: "Profile", icon: UserRound },
  { id: SettingsToggle.Streetview, label: "View", icon: Eye },
  { id: SettingsToggle.Audio, label: "Sound", icon: Volume2 },
];

const close = () => settingsStateActions.updateSettingsVisibility(false);

const Settings = () => {
  const [currentSettingToggle, setCurrentSettingToggle] =
    useState<SettingsToggle>(SettingsToggle.Room);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={close}
    >
      <motion.div
        role="dialog"
        aria-label="Settings"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-[min(85dvh,40rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl shadow-black/60 sm:flex-row"
      >
        <nav className="flex shrink-0 flex-col border-b border-white/10 bg-card/50 sm:w-48 sm:border-r sm:border-b-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:pb-4">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={close}
              aria-label="Close settings"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground sm:hidden"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 px-2 pb-2 sm:flex sm:flex-col">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = currentSettingToggle === id;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentSettingToggle(id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3 sm:text-sm transition-colors ${active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                >
                  <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <button
            onClick={close}
            aria-label="Close settings"
            className="absolute top-3 right-3 z-10 hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground sm:flex"
          >
            <X className="size-4" />
          </button>
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-6">
            {currentSettingToggle === SettingsToggle.Room && <RoomSettings />}
            {currentSettingToggle === SettingsToggle.Streetview && (
              <StreetviewSettings />
            )}
            {currentSettingToggle === SettingsToggle.Username && (
              <UsernameSettings />
            )}
            {currentSettingToggle === SettingsToggle.Audio && <AudioSettings />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
