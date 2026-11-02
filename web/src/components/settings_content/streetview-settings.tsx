import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Zustand
import { StreetviewStateActions } from "@/store/useSettingsStore";
import { useStreetviewSettings } from "@/store/useSettingsStore";
import RoomConfig from "@/types/room-config";
import { useShallow } from "zustand/shallow";
import { settingsStateActions } from "@/store/useSettingsStore";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-row justify-between items-center">
        <p className="text-xl font-semibold">Streetview</p>
        <Button
          className="bg-transparent hover:cursor-pointer"
          onClick={() => settingsStateActions.updateSettingsVisibility(false)}
          variant={"secondary"}
        >
          <X color="white" />
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="panningGesturesEnabled">Panning Gestures</Label>
        <Switch
          checked={panning}
          onCheckedChange={(panningGesturesEnabled) =>
            handleConfigRequest({ panningGesturesEnabled })
          }
          id="panningGesturesEnabled"
        />
      </div>
      <Separator />

      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="streetNamesEnabled">Street Names</Label>
        <Switch
          checked={streetNames}
          onCheckedChange={(streetNamesEnabled) =>
            handleConfigRequest({ streetNamesEnabled })
          }
          id="streetNamesEnabled"
        />
      </div>
      <Separator />
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="zoomGesturesEnabled">Zoom Gestures</Label>
        <Switch
          checked={zooming}
          onCheckedChange={(zoomGesturesEnabled) =>
            handleConfigRequest({ zoomGesturesEnabled })
          }
          id="zoomGesturesEnabled"
        />
      </div>
      <Separator />
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="userNavigationEnabled">User Navigation</Label>
        <Switch
          checked={navigation}
          onCheckedChange={(userNavigationEnabled) =>
            handleConfigRequest({ userNavigationEnabled })
          }
          id="userNavigationEnabled"
        />
      </div>
    </>
  );
};

export default StreetviewSettings;
