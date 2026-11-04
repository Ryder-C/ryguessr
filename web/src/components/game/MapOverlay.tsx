"use client";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
  Fragment,
} from "react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import {
  Loader2,
  Map as MapIcon,
  Minimize2,
  MousePointerClick,
} from "lucide-react";
import { Button } from "../ui/button";
import interpolateGreatCircle from "@/lib/haversine";
import { isConfirmKey, shouldIgnoreHotkey } from "@/lib/hotkeys";
import { playSound, preloadSound } from "@/lib/sound";

// Coordinates type
import MapOverlayProps from "@/types/map_overlay_props";
import Coordinates from "@/types/coordinate_type";
import PlayerResults from "@/types/player-results";

// Zustand
import { useGameSession } from "@/store/useSettingsStore";
import { useAudioState } from "@/store/useSettingsStore";

const MARKER_SOUND = "/audio/place-marker.mp3";
const LOCK_SOUND = "/audio/lock-guess.mp3";

const pinSvg = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg>`;

// A plain flag planted on the real location; the pole's foot is the anchor
const flagSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M8 30V4h17l-4 6 4 6H8" fill="#FFFFFF" stroke="#111827" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

const svgUrl = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const dashedLine = (color: string) => ({
  strokeColor: color,
  strokeOpacity: 0,
  zIndex: 10,
  icons: [
    {
      icon: {
        path: "M 0,0 0,-2",
        strokeOpacity: 1,
        strokeColor: color,
        scale: 3,
      },
      offset: "12px",
      repeat: "16px",
    },
  ],
});

export const MapOverlay = memo(function MapOverlay({
  roundData,
  handleGuess,
  hasGuessed,
  showResults,
  mapExpanded,
  compact,
  inputLocked,
  handleSetMapExpanded,
}: MapOverlayProps) {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(
    null,
  );

  const { markerAudioEnabled, lockAudioEnabled } = useAudioState();

  useEffect(() => {
    preloadSound(MARKER_SOUND);
    preloadSound(LOCK_SOUND);
  }, []);

  const activeIconColor = useGameSession((state) => state.activeIconColor);

  const createPlayerIcon = useCallback((color: string) => {
    return {
      url: svgUrl(pinSvg(color)),
      anchor: new google.maps.Point(16, 30),
      scaledSize: new google.maps.Size(32, 32),
    };
  }, []);

  const userIconOptions = useMemo(
    () => createPlayerIcon(activeIconColor),
    [activeIconColor, createPlayerIcon],
  );

  const { locationIconOptions, mapContainerStyle } = useMemo(() => {
    return {
      locationIconOptions: {
        url: svgUrl(flagSvg),
        anchor: new google.maps.Point(8, 30),
        scaledSize: new google.maps.Size(32, 32),
      },
      mapContainerStyle: { width: "100%", height: "100%" },
    };
  }, []);

  const mapRef = useRef<google.maps.Map | null>(null);

  const mapOptions = useMemo(() => {
    return {
      draggableCursor: hasGuessed ? "grab" : "crosshair",
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      draggingCursor: "grabbing",
      minZoom: 2,
      backgroundColor: "#0f131a",
    };
  }, [hasGuessed]);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
      if (markerAudioEnabled) playSound(MARKER_SOUND);
    },
    [markerAudioEnabled],
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    map.setCenter({ lat: 20, lng: 0 });
    map.setZoom(2);
  }, []);

  const submitGuess = useCallback(() => {
    if (!selectedLocation || hasGuessed) return;
    handleGuess(selectedLocation);
    if (lockAudioEnabled) playSound(LOCK_SOUND);
  }, [selectedLocation, hasGuessed, handleGuess, lockAudioEnabled]);

  // Space / Enter locks in the guess
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (inputLocked || showResults || shouldIgnoreHotkey(e)) return;
      if (isConfirmKey(e)) {
        e.preventDefault();
        submitGuess();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inputLocked, showResults, submitGuess]);

  // Frame every guess and the real location once the map has grown to full screen
  useEffect(() => {
    if (!showResults || !roundData || !mapRef.current) return;
    const timer = setTimeout(() => {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(roundData.real_location);
      for (const entry of roundData.player_results) {
        bounds.extend(entry.guess_location);
      }
      // Keep markers clear of the HUD and the result card, scaled for short screens
      const height = mapRef.current?.getDiv().clientHeight ?? 800;
      mapRef.current?.fitBounds(bounds, {
        top: Math.min(80, height * 0.2),
        bottom: Math.min(260, height * 0.45),
        left: 48,
        right: 48,
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [showResults, roundData]);

  const collapsed = compact && !mapExpanded && !showResults;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div
        className={`relative z-0 w-full flex-grow overflow-hidden shadow-2xl shadow-black/50 transition-[border-radius] ${showResults ? "" : "rounded-2xl ring-1 ring-white/20"}`}
      >
        {collapsed && (
          <button
            aria-label="Open map"
            className="absolute inset-0 z-20 flex items-end justify-start bg-transparent p-1.5"
            onClick={(e) => {
              e.stopPropagation();
              handleSetMapExpanded(true);
            }}
          >
            <span className="glass flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium">
              <MapIcon className="size-3.5" />
              {hasGuessed
                ? "Waiting…"
                : selectedLocation
                  ? "Guess"
                  : "Tap to guess"}
            </span>
          </button>
        )}
        {compact && mapExpanded && !showResults && (
          <button
            aria-label="Minimize map"
            onClick={() => handleSetMapExpanded(false)}
            className="glass absolute top-2 right-2 z-20 flex size-9 items-center justify-center rounded-lg"
          >
            <Minimize2 className="size-4" />
          </button>
        )}
        {!selectedLocation && !hasGuessed && !collapsed && (
          <div className="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2">
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground whitespace-nowrap">
              <MousePointerClick className="size-3.5" />
              {compact ? "Tap" : "Click"} to place your pin
            </span>
          </div>
        )}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          onLoad={onLoad}
          options={mapOptions}
          onClick={!hasGuessed ? onMapClick : undefined}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={userIconOptions}
              zIndex={50}
            />
          )}
          {showResults && selectedLocation && roundData && (
            <>
              <Marker
                position={{
                  lat: roundData.real_location.lat,
                  lng: roundData.real_location.lng,
                }}
                icon={locationIconOptions}
                zIndex={60}
              />
              <Polyline
                options={dashedLine(activeIconColor)}
                path={interpolateGreatCircle(
                  selectedLocation,
                  roundData.real_location,
                  100,
                )}
              />
              {Object.values(roundData.player_results).map(
                (entry: PlayerResults) => {
                  const isCurrentUser =
                    Math.abs(entry.guess_location.lat - selectedLocation.lat) <
                      0.00001 &&
                    Math.abs(entry.guess_location.lng - selectedLocation.lng) <
                      0.00001;

                  if (isCurrentUser) return null;

                  return (
                    <Fragment key={entry.player.username}>
                      <Marker
                        position={entry.guess_location}
                        icon={createPlayerIcon(entry.player.color)}
                        title={entry.player.username}
                      />

                      <Polyline
                        path={interpolateGreatCircle(
                          entry.guess_location,
                          roundData.real_location,
                          100,
                        )}
                        options={dashedLine(entry.player.color)}
                      />
                    </Fragment>
                  );
                },
              )}
            </>
          )}
        </GoogleMap>
      </div>
      {!showResults && (
        <Button
          className={`h-11 w-full rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-black/40 transition-all active:scale-[0.98] disabled:border disabled:border-white/10 disabled:bg-background/75 disabled:backdrop-blur-xl ${collapsed ? "hidden" : ""}`}
          disabled={!selectedLocation || hasGuessed}
          onClick={submitGuess}
        >
          {hasGuessed ? (
            <>
              <Loader2 className="animate-spin" />
              Waiting for other players…
            </>
          ) : selectedLocation ? (
            <>
              Guess
              <kbd
                className={`ml-1 rounded border border-white/30 bg-white/15 px-1.5 py-0.5 font-mono text-[0.65rem] font-medium ${compact ? "hidden" : ""}`}
              >
                Space
              </kbd>
            </>
          ) : (
            "Place your pin on the map"
          )}
        </Button>
      )}
    </div>
  );
});
