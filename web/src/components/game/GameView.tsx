"use client";
import Streetview from "./StreetView";
import { MapOverlay } from "./MapOverlay";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { EventSource } from "eventsource";
import { Scoreboard } from "./Scoreboard";
import Settings from "@/components/game/Settings";
import { AnimatePresence } from "framer-motion";
import { Hud } from "./Hud";
import { RoundResult } from "./RoundResult";
import { LoadingScreen } from "../initialize/loading-screen";
// Type Data
import RoundData from "@/types/round-data";
import ScoreData from "@/types/score-data";
import RoundStart from "@/types/round-start";
import Coordinates from "@/types/coordinate_type";

// Signals
import {
  refreshSseEventStream,
  useSignal,
  refreshPlayerList,
} from "@/lib/signal";
import PlayerScore from "@/types/player-score";

// Zustand
import {
  useSettingsState,
  useGameSession,
  StreetviewStateActions,
} from "@/store/useSettingsStore";
import PlayerData from "@/types/player-data";
import PlayerLeave from "@/types/player-leave";
import { AutoDismissAlert } from "./AlertManager";
import NotificationItem from "@/types/notification-item";
import RoomConfig from "@/types/room-config";

let notificationId = 0;

export const GameView = () => {
  const [panoId, setPanoId] = useState<string | undefined>(undefined);
  const [hasGuessed, setHasGuessed] = useState<boolean>(false);
  const [roundData, setRoundData] = useState<RoundData | undefined>(undefined);
  const [hasContinued, setHasContinued] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(0);
  // The server counts rounds from 0
  const displayRound = roundNumber + 1;
  const [shownScoreboard, setShownScoreboard] = useState<boolean>(false);
  const [notifications, addNotifications] = useState<NotificationItem[]>([]);
  const [mapExpanded, setMapExpanded] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const es = useRef<EventSource | null>(null);

  const settingsVisibility = useSettingsState(
    (state) => state.settingsVisibility,
  );
  const username = useGameSession((state) => state.activeUsername);

  const showResults = hasGuessed && roundData !== undefined;

  const score_data = useMemo(() => {
    if (roundData) {
      const score_data: ScoreData = { player_scores: [] } as ScoreData;
      for (const entry of Object.values(roundData.player_results)) {
        score_data.player_scores.push({
          name: entry.player.username,
          last_score: entry.round_score,
          cum_score: entry.player.score,
          distance: entry.distance,
          IconColor: entry.player.color,
        });
      }
      score_data.player_scores = score_data.player_scores.sort(
        (a: PlayerScore, b: PlayerScore): number => {
          return Number(b.cum_score) - Number(a.cum_score);
        },
      );
      return score_data;
    }
    return null;
  }, [roundData]);

  const myResult = useMemo(
    () => roundData?.player_results.find((r) => r.player.username === username),
    [roundData, username],
  );

  const pushNotification = useCallback(
    (notification: Omit<NotificationItem, "id">) => {
      const id = `${++notificationId}`;
      addNotifications((prev) => [...prev.slice(-3), { id, ...notification }]);
    },
    [],
  );

  const SSEConnect = useCallback(() => {
    if (es.current) {
      es.current.close();
    }
    es.current = new EventSource("/api/events", {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...init.headers,
          },
        }),
    });

    es.current.addEventListener("round-start", (event) => {
      const round_start: RoundStart = JSON.parse(event.data);
      setPanoId(round_start.pano_id);
      setRoundNumber(round_start.round);
      setHasGuessed(false);
      setHasContinued(false);
      setShownScoreboard(false);
      setRoundData(undefined);
      setMapExpanded(false);
    });

    es.current.addEventListener("round-end", (event) => {
      const round_data = JSON.parse(event.data);
      setRoundData(round_data);
    });

    es.current.addEventListener("player-joined", (event) => {
      const playerJoinData: PlayerData = JSON.parse(event.data);
      pushNotification({
        kind: "join",
        username: playerJoinData.username,
        color: playerJoinData.color,
      });
      refreshPlayerList.emit();
    });

    es.current.addEventListener("player-left", (event) => {
      const playerLeaveData: PlayerLeave = JSON.parse(event.data);
      pushNotification({ kind: "leave", username: playerLeaveData.username });
      refreshPlayerList.emit();
    });

    es.current.addEventListener("config-update", (event) => {
      const roomConfig: Partial<RoomConfig> = JSON.parse(event.data);
      StreetviewStateActions.setRoomConfig(roomConfig);
    });
  }, [pushNotification]);

  useSignal(refreshSseEventStream, () => {
    SSEConnect();
  });

  useEffect(() => {
    SSEConnect();
    return () => {
      if (es.current) {
        es.current?.close();
        es.current = null;
      }
    };
  }, [SSEConnect]);

  const handleGuess = useCallback(async (selectedLocation: Coordinates) => {
    setHasGuessed(true);
    const response = await fetch("/api/guess", {
      method: "POST",
      body: JSON.stringify(selectedLocation),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.log(response);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    setHasContinued(true);
    const response = await fetch("/api/next", {
      method: "POST",
      headers: {},
    });
    if (!response.ok) {
      console.log(response);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    addNotifications((prev) => prev.filter((noti) => noti.id !== id));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (mapRef.current && !mapRef.current.contains(event.target as Node)) {
        setMapExpanded(false);
      }
    }

    if (mapExpanded) {
      document.addEventListener("pointerdown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [mapExpanded]);

  // Map container geometry for each phase of the round
  const mapContainerClass = showResults
    ? "right-0 bottom-0 w-full h-full"
    : mapExpanded
      ? "right-3 bottom-3 w-[calc(100%-1.5rem)] h-[70dvh] sm:right-4 sm:bottom-4 sm:w-[min(60vw,52rem)] sm:h-[min(65vh,36rem)]"
      : "right-3 bottom-3 w-36 h-28 sm:right-4 sm:bottom-4 sm:w-[22rem] sm:h-[16rem] sm:hover:w-[min(60vw,52rem)] sm:hover:h-[min(65vh,36rem)] sm:hover:delay-0 sm:delay-300";

  return (
    <main className="bg-black relative h-dvh w-full overflow-hidden select-none">
      <div className="absolute inset-0 z-0">
        {panoId ? (
          <Streetview panoId={panoId} />
        ) : (
          <LoadingScreen message="Dropping you somewhere…" />
        )}
      </div>

      {!showResults && <Hud roundNumber={displayRound} />}

      <div className="pointer-events-none absolute inset-x-0 top-16 sm:top-20 z-50 flex flex-col items-center gap-2 px-3">
        <AnimatePresence initial={false}>
          {notifications.map((noti) => {
            return (
              <AutoDismissAlert
                key={noti.id}
                notification={noti}
                onDismiss={() => removeNotification(noti.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div
        ref={mapRef}
        className={`absolute z-10 transition-all duration-300 ease-out ${mapContainerClass}`}
      >
        <MapOverlay
          key={`map-round${roundNumber}`}
          mapExpanded={mapExpanded}
          showResults={showResults}
          roundData={roundData}
          hasGuessed={hasGuessed}
          inputLocked={settingsVisibility || shownScoreboard}
          handleGuess={handleGuess}
          handleSetMapExpanded={setMapExpanded}
        />
      </div>

      <AnimatePresence>
        {showResults && !shownScoreboard && (
          <RoundResult
            key="round-result"
            roundNumber={displayRound}
            result={myResult}
            onShowStandings={() => setShownScoreboard(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {score_data && shownScoreboard && (
          <Scoreboard
            key="scoreboard"
            roundNumber={displayRound}
            score_data={score_data}
            hasContinued={hasContinued}
            onContinue={handleContinue}
            onClose={() => setShownScoreboard(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{settingsVisibility && <Settings />}</AnimatePresence>
    </main>
  );
};
