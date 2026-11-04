"use client";
import { useEffect, useState, useRef } from "react";

// types
import GameInit from "@/types/game-init";

// zustand
import {
  playerActions,
  RoomSettingsActions,
  useUserSettings,
  APIKEYActions,
  useAPIKEY,
} from "@/store/useSettingsStore";
import GoogleMapLoader from "./map-load";
import { LoadingScreen } from "./loading-screen";

export const Init = () => {
  const [responseCode, setResponseCode] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();

  const hasInitialized = useRef(false);

  const google_maps_api_key = useAPIKEY((state) => state.google_maps_api_key);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeRyguessr = async () => {
      const { savedUsername, savedIconColor } = useUserSettings.getState();

      const payload: Record<string, string> = {};
      if (savedUsername) payload.username = savedUsername;
      if (savedIconColor) payload.color = savedIconColor;

      try {
        const response = await fetch("/api/init", {
          method: "POST",
          credentials: "same-origin",
          body:
            Object.keys(payload).length > 0
              ? JSON.stringify(payload)
              : JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const init_response: GameInit = await response.json();
          APIKEYActions.updateAPIKEY(init_response.api_key);
          RoomSettingsActions.updateRoomCode(init_response.room_id);
          playerActions.setActiveUsername(init_response.username);
          playerActions.setActiveColor(init_response.color);
          setResponseCode(response.status);
        } else {
          console.error("Initialization failed... status:", response.status);
          setError(
            `Couldn't reach the server (${response.status}). Try refreshing.`,
          );
        }
      } catch (error) {
        console.error("Network error during init:", error);
        setError(
          "Couldn't reach the server. Check your connection and refresh.",
        );
      }
    };
    initializeRyguessr();
  }, []);

  return responseCode == 200 && google_maps_api_key ? (
    <GoogleMapLoader APIKEY={google_maps_api_key} />
  ) : (
    <LoadingScreen error={error} />
  );
};
