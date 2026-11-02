// Zustand
import { StreetviewStateActions } from "@/store/useSettingsStore";
import { useStreetviewSettings } from "@/store/useSettingsStore";
import { useShallow } from "zustand/shallow";
import RoomConfig from "@/types/room-config";

import { SectionHeader, SettingsGroup, ToggleRow } from "./setting-row";

const StreetviewSettings = () => {
  // Apply locally for responsiveness, then share with the room (echoed back via `config-update`).
  // Only the changed setting is sent so simultaneous edits by other players aren't overwritten.
  const handleConfigRequest = (change: Partial<RoomConfig>) => {
    StreetviewStateActions.applyRoomConfig(change);
    fetch("/api/config", {
      method: "POST",
      body: JSON.stringify(change),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.log(`Room config update failed status: ${response.status}`);
        }
      })
      .catch((error) => console.log(error));
  };

  const { panning, streetNames, zooming, navigation } = useStreetviewSettings(
    useShallow((state) => ({
      panning: state.panningGesturesEnabled,
      streetNames: state.streetNamesEnabled,
      zooming: state.zoomGesturesEnabled,
      navigation: state.userNavigationEnabled,
    })),
  );

  return (
    <>
      <SectionHeader
        title="View"
        description="Make rounds easier or harder by limiting what you can do in Street View. Changes apply to everyone in the room."
      />
      <SettingsGroup>
        <ToggleRow
          id="panningGesturesEnabled"
          label="Look around"
          description="Drag to pan the camera. Off shows a single still photo."
          checked={panning}
          onCheckedChange={(panningGesturesEnabled) => handleConfigRequest({ panningGesturesEnabled })}
        />
        <ToggleRow
          id="userNavigationEnabled"
          label="Move"
          description="Walk down the street by clicking arrows or the road."
          checked={navigation}
          disabled={!panning}
          onCheckedChange={(userNavigationEnabled) => handleConfigRequest({ userNavigationEnabled })}
        />
        <ToggleRow
          id="zoomGesturesEnabled"
          label="Zoom"
          description="Scroll or pinch to zoom in on details."
          checked={zooming}
          disabled={!panning}
          onCheckedChange={(zoomGesturesEnabled) => handleConfigRequest({ zoomGesturesEnabled })}
        />
        <ToggleRow
          id="streetNamesEnabled"
          label="Street names"
          description="Show road labels. Makes it much easier!"
          checked={streetNames}
          disabled={!panning}
          onCheckedChange={(streetNamesEnabled) => handleConfigRequest({ streetNamesEnabled })}
        />
      </SettingsGroup>
    </>
  );
};

export default StreetviewSettings;
