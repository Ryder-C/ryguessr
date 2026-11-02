import { useEffect, useReducer, useState } from "react";
import PlayerData from "@/types/player-data";
import { refreshPlayerList, useSignal } from "@/lib/signal";
import { useRoomSettings } from "@/store/useSettingsStore";

/** Live roster of the room the player is currently in. */
export function useRoomPlayers() {
  const roomCode = useRoomSettings((state) => state.roomCode);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [version, bump] = useReducer((v: number) => v + 1, 0);

  useSignal(refreshPlayerList, bump);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    fetch(`/api/room/${roomCode}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PlayerData[] | null) => {
        if (!cancelled && data) setPlayers(data);
      })
      .catch((error) => console.error("Failed to fetch room players:", error));
    return () => {
      cancelled = true;
    };
  }, [roomCode, version]);

  return players;
}
