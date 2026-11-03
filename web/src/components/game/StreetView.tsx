"use client";
import { GoogleMap, StreetViewPanorama } from "@react-google-maps/api";
import { memo, useCallback, useMemo, useRef } from "react";
import { StaticStreetview } from "./StaticStreetview";

// Zustand
import { useStreetviewSettings } from "@/store/useSettingsStore";

const Streetview = memo(function Streetview({ panoId }: { panoId?: string }) {
  const {
    panningGesturesEnabled,
    streetNamesEnabled,
    zoomGesturesEnabled,
    userNavigationEnabled,
  } = useStreetviewSettings();

  const panorama = useRef<google.maps.StreetViewPanorama | null>(null);

  // Hiding the arrows doesn't stop arrow keys / WASD from moving (and keyboard
  // shortcuts can't be turned off after load), so snap back to the round's location
  const lockPano = useCallback(() => {
    const current = panorama.current?.getPano();
    if (!userNavigationEnabled && panoId && current && current !== panoId) {
      panorama.current?.setPano(panoId);
    }
  }, [userNavigationEnabled, panoId]);

  const streetViewOptions = useMemo(() => {
    return {
      // Custom controls
      clickToGo: userNavigationEnabled,
      linksControl: userNavigationEnabled,
      showRoadLabels: streetNamesEnabled,
      panControl: panningGesturesEnabled,
      scrollwheel: zoomGesturesEnabled,
      disableDoubleClickZoom: !zoomGesturesEnabled,
      zoomControl: zoomGesturesEnabled,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM,
      },

      // Default Controls
      visible: true,
      pano: panoId,
      addressControl: false,
      enableCloseButton: false,
      fullscreenControl: false,
      disableDefaultUI: true,
    };
  }, [
    panningGesturesEnabled,
    streetNamesEnabled,
    zoomGesturesEnabled,
    userNavigationEnabled,
    panoId,
  ]);

  return (
    <div className="h-full w-full">
      {panningGesturesEnabled ? (
        <GoogleMap
          zoom={10}
          mapContainerStyle={{ width: "100%", height: "100%" }}
        >
          <StreetViewPanorama
            options={streetViewOptions}
            onLoad={(p) => {
              panorama.current = p;
            }}
            onPanoChanged={lockPano}
          />
        </GoogleMap>
      ) : (
        <StaticStreetview panoId={panoId} />
      )}
    </div>
  );
});

export default Streetview;
