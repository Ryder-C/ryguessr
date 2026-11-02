"use client";
import { useState, useEffect } from "react";
import { Check, Copy, Loader2, LogIn } from "lucide-react";
import { Button } from "../ui/button";

// Zustand useRoomSettings
import {
  playerActions,
  RoomSettingsActions,
  useRoomSettings,
  useGameSession,
  settingsStateActions,
} from "@/store/useSettingsStore";

// RoomPeek reseponse type
import PlayerData from "@/types/player-data";

// Signals
import { refreshSseEventStream } from "@/lib/signal";
import { useRoomPlayers } from "@/lib/useRoomPlayers";

import { SectionHeader } from "./setting-row";

const ROOM_CODE_LENGTH = 4;

type PeekState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; players: PlayerData[] }
  | { status: "not-found" }
  | { status: "error" };

const PlayerList = ({
  players,
  username,
}: {
  players: PlayerData[];
  username?: string;
}) => (
  <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-card/40">
    {[...players]
      .sort((a, b) => b.score - a.score)
      .map((player) => (
        <li
          key={player.username}
          className="flex items-center gap-3 px-4 py-2.5 text-sm"
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black/80"
            style={{ backgroundColor: player.color }}
          >
            {player.username.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate font-medium">{player.username}</span>
            {player.username === username && (
              <span className="rounded bg-primary/20 px-1.5 py-px text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                You
              </span>
            )}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {player.score.toLocaleString()} pts
          </span>
        </li>
      ))}
  </ul>
);

const RoomSettings = () => {
  const roomCode = useRoomSettings((state) => state.roomCode);
  const username = useGameSession((state) => state.activeUsername);
  const players = useRoomPlayers();

  const [codeInput, setCodeInput] = useState("");
  const [peek, setPeek] = useState<PeekState>({ status: "idle" });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  const isOwnRoom = codeInput === roomCode;

  // Look up the typed room as soon as the code is complete
  useEffect(() => {
    setJoinError(undefined);
    if (codeInput.length !== ROOM_CODE_LENGTH || codeInput === roomCode) {
      setPeek({ status: "idle" });
      return;
    }
    let cancelled = false;
    setPeek({ status: "loading" });
    fetch(`/api/room/${codeInput}`)
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setPeek({ status: "found", players: await response.json() });
        } else {
          setPeek({ status: response.status === 404 ? "not-found" : "error" });
        }
      })
      .catch(() => !cancelled && setPeek({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [codeInput, roomCode]);

  const handleRoomJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (peek.status !== "found" || joining) return;
    setJoining(true);
    try {
      const response = await fetch("/api/join", {
        method: "POST",
        body: JSON.stringify(codeInput),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        setJoinError(`Couldn't join that room (${response.status}).`);
        return;
      }
      const joinResponse: PlayerData = await response.json();
      playerActions.setActiveColor(joinResponse.color);
      RoomSettingsActions.updateRoomCode(codeInput);
      refreshSseEventStream.emit();
      setCodeInput("");
      settingsStateActions.updateSettingsVisibility(false);
    } catch {
      setJoinError("Network error while joining. Try again.");
    } finally {
      setJoining(false);
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard needs a secure context; the code is visible anyway
    }
  };

  const status = (() => {
    if (joinError) return { text: joinError, className: "text-destructive" };
    if (isOwnRoom)
      return {
        text: "You're already in this room.",
        className: "text-muted-foreground",
      };
    switch (peek.status) {
      case "loading":
        return {
          text: "Looking for room…",
          className: "text-muted-foreground",
        };
      case "found":
        return {
          text: `Room found · ${peek.players.length} ${peek.players.length === 1 ? "player" : "players"}`,
          className: "text-primary",
        };
      case "not-found":
        return {
          text: "No room with that code.",
          className: "text-destructive",
        };
      case "error":
        return {
          text: "Couldn't look up that room.",
          className: "text-destructive",
        };
      default:
        return {
          text: "Enter a 4-character code from a friend.",
          className: "text-muted-foreground",
        };
    }
  })();

  return (
    <>
      <SectionHeader
        title="Room"
        description="Everyone in a room sees the same location each round."
      />

      <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/[0.07] p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your room code
          </span>
          <span className="font-mono text-4xl font-bold tracking-[0.25em] text-foreground">
            {roomCode}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={copyRoomCode}
          className="shrink-0 rounded-lg"
        >
          {copied ? <Check className="text-primary" /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Players in this room · {players.length}
        </h4>
        <PlayerList players={players} username={username} />
      </div>

      <form className="flex flex-col gap-2" onSubmit={handleRoomJoinRequest}>
        <h4 className="text-sm font-medium text-muted-foreground">
          Join a friend&apos;s room
        </h4>
        <div className="flex gap-2">
          <input
            id="input-field-roomcode"
            name="room_code"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCD"
            maxLength={ROOM_CODE_LENGTH}
            value={codeInput}
            enterKeyHint="go"
            onChange={(e) =>
              setCodeInput(
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
              )
            }
            className="h-12 w-full min-w-0 rounded-xl border border-white/15 bg-white/[0.04] px-4 font-mono text-2xl font-semibold uppercase tracking-[0.4em] outline-none transition-colors placeholder:text-white/20 focus:border-primary/60 focus:ring-3 focus:ring-primary/20"
          />
          <Button
            type="submit"
            disabled={peek.status !== "found" || joining}
            className="h-12 shrink-0 rounded-xl px-5 font-semibold"
          >
            {joining ? <Loader2 className="animate-spin" /> : <LogIn />}
            Join
          </Button>
        </div>
        <p className={`text-xs ${status.className}`}>{status.text}</p>
        {peek.status === "found" && peek.players.length > 0 && (
          <PlayerList players={peek.players} />
        )}
      </form>
    </>
  );
};

export default RoomSettings;
