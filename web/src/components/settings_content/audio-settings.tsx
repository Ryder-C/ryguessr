// Zustand
import { useShallow } from "zustand/shallow";
import { audioStateActions } from "@/store/useSettingsStore";
import { useAudioState } from "@/store/useSettingsStore";

import { SectionHeader, SettingsGroup, ToggleRow } from "./setting-row";

const AudioSettings = () => {
  const { markerAudio, lockAudio } = useAudioState(
    useShallow((state) => ({
      markerAudio: state.markerAudioEnabled,
      lockAudio: state.lockAudioEnabled,
    })),
  );

  return (
    <>
      <SectionHeader title="Sound" description="Sound effects during play." />
      <SettingsGroup>
        <ToggleRow
          id="markerAudioEnabled"
          label="Pin drop"
          description="Play a sound when you place your pin."
          checked={markerAudio}
          onCheckedChange={audioStateActions.setMarkerAudioEnabled}
        />
        <ToggleRow
          id="lockAudioEnabled"
          label="Guess locked in"
          description="Play a sound when you submit your guess."
          checked={lockAudio}
          onCheckedChange={audioStateActions.setLockAudioEnabled}
        />
      </SettingsGroup>
    </>
  );
};

export default AudioSettings;
