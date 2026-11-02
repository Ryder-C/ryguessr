"use client";
import { useState } from "react";
import { Check, Copy, Settings2, Users } from "lucide-react";

import { useRoomPlayers } from "@/lib/useRoomPlayers";
import {
  settingsStateActions,
  useGameSession,
  useRoomSettings,
  useSettingsState,
} from "@/store/useSettingsStore";

const MAX_AVATARS = 4;

export const Hud = ({ roundNumber }: { roundNumber: number }) => {
  const roomCode = useRoomSettings((state) => state.roomCode);
  const username = useGameSession((state) => state.activeUsername);
  const settingsVisibility = useSettingsState(
    (state) => state.settingsVisibility,
  );
  const players = useRoomPlayers();
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API is unavailable on insecure origins; open settings instead
      settingsStateActions.updateSettingsVisibility(true);
    }
  };

  // You always lead the stack and sit on top of the overlap
  const orderedPlayers = [...players].sort(
    (a, b) => Number(b.username === username) - Number(a.username === username),
  );
  const shownPlayers = orderedPlayers.slice(0, MAX_AVATARS);
  const overflow = players.length - shownPlayers.length;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="glass pointer-events-auto flex items-center rounded-xl text-sm">
        <button
          onClick={copyRoomCode}
          title="Copy room code"
          className="group flex items-center gap-2 rounded-l-xl py-2 pl-3 pr-2.5 transition-colors hover:bg-white/5"
        >
          <span className="hidden text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            Room
          </span>
          <span className="font-mono text-base font-semibold tracking-[0.2em]">
            {roomCode}
          </span>
          {copied ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <Copy className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
          )}
        </button>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
            Round
          </span>
          <span className="font-semibold tabular-nums">{roundNumber}</span>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => settingsStateActions.updateSettingsVisibility(true)}
          title={orderedPlayers.map((p) => p.username).join(", ")}
          className="glass flex h-10 items-center gap-2 rounded-xl pl-2 pr-3 transition-colors hover:bg-background/90"
        >
          <div className="flex -space-x-1.5">
            {shownPlayers.map((player, index) => (
              <span
                key={player.username}
                className={`relative flex size-6 items-center justify-center rounded-full text-[0.65rem] font-bold text-black/80 ring-2 ${player.username === username ? "ring-white" : "ring-background"}`}
                style={{
                  backgroundColor: player.color,
                  zIndex: shownPlayers.length - index,
                }}
              >
                {player.username.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
          {overflow > 0 && (
            <span className="text-xs text-muted-foreground">+{overflow}</span>
          )}
          <Users className="size-4 text-muted-foreground sm:hidden" />
          <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
            {players.length} {players.length === 1 ? "player" : "players"}
          </span>
        </button>
        <button
          onClick={() =>
            settingsStateActions.updateSettingsVisibility(!settingsVisibility)
          }
          aria-label="Settings"
          className="glass flex size-10 items-center justify-center rounded-xl transition-all hover:bg-background/90 active:scale-95"
        >
          <Settings2 className="size-5" />
        </button>
      </div>
    </div>
  );
};
