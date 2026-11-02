"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, MapPin, Pipette } from "lucide-react";
import { ColorPicker, useColor } from "react-color-palette";
import "@/components/ui/react-color-palette.css";

// Zustand
import { playerActions, useGameSession } from "@/store/useSettingsStore";
import { useShallow } from "zustand/shallow";
import { refreshPlayerList } from "@/lib/signal";

import { SectionHeader } from "./setting-row";

const MAX_USERNAME_LENGTH = 24;

const PRESET_COLORS = [
  "#F87171",
  "#FB923C",
  "#FACC15",
  "#4ADE80",
  "#2DD4BF",
  "#38BDF8",
  "#818CF8",
  "#C084FC",
  "#F472B6",
  "#F5F5F4",
];

const postJson = async (url: string, body: unknown) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) refreshPlayerList.emit();
    return response.ok;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const UsernameSettings = () => {
  const { activeUsername, activeIconColor } = useGameSession(
    useShallow((state) => ({
      activeUsername: state.activeUsername,
      activeIconColor: state.activeIconColor,
    })),
  );

  const [nameInput, setNameInput] = useState(activeUsername);
  const [nameSaved, setNameSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [color, setColor] = useColor(activeIconColor || "#FFFFFF");

  const trimmedName = nameInput.trim();
  const canSaveName = trimmedName.length > 0 && trimmedName !== activeUsername;

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSaveName) return;
    playerActions.saveCustomUsername(trimmedName);
    setNameInput(trimmedName);
    if (await postJson("/api/username", trimmedName)) {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1500);
    }
  };

  const saveColor = (hex: string) => {
    playerActions.saveCustomColor(hex);
    postJson("/api/color", hex);
  };

  const pickPreset = (hex: string) => {
    setColor({ ...color, hex });
    saveColor(hex);
  };

  const previewColor = showPicker ? color.hex : activeIconColor;

  return (
    <>
      <SectionHeader
        title="Profile"
        description="How other players see you on the map and scoreboard."
      />

      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-card/40 p-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${previewColor}26` }}
        >
          <MapPin
            className="size-9"
            fill={previewColor}
            color="white"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold">
            {trimmedName || activeUsername}
          </span>
          <span className="text-xs text-muted-foreground">
            This is your pin
          </span>
        </div>
      </div>

      <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-2">
        <label
          htmlFor="input-field-username"
          className="text-sm font-medium text-muted-foreground"
        >
          Name
        </label>
        <div className="flex gap-2">
          <input
            id="input-field-username"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={MAX_USERNAME_LENGTH}
            name="username"
            type="text"
            autoComplete="nickname"
            className="h-11 w-full min-w-0 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-base font-medium outline-none transition-colors focus:border-primary/60 focus:ring-3 focus:ring-primary/20"
          />
          <Button
            type="submit"
            disabled={!canSaveName && !nameSaved}
            className="h-11 w-20 shrink-0 rounded-xl font-semibold"
          >
            {nameSaved ? <Check /> : "Save"}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-muted-foreground">Color</span>
        <div className="flex flex-wrap gap-2.5">
          {PRESET_COLORS.map((hex) => {
            const selected = activeIconColor.toUpperCase() === hex;
            return (
              <button
                key={hex}
                aria-label={`Use color ${hex}`}
                onClick={() => pickPreset(hex)}
                className={`flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110 ${selected ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""}`}
                style={{ backgroundColor: hex }}
              >
                {selected && <Check className="size-4 text-black/70" />}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pipette className="size-4" />
          Custom color
          <ChevronDown
            className={`size-4 transition-transform ${showPicker ? "rotate-180" : ""}`}
          />
        </button>
        {showPicker && (
          <div className="rounded-xl border border-white/10 bg-card/40">
            <ColorPicker
              color={color}
              onChange={setColor}
              hideAlpha={true}
              hideInput={["rgb", "hsv"]}
              height={140}
              onChangeComplete={(color) => saveColor(color.hex)}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default UsernameSettings;
