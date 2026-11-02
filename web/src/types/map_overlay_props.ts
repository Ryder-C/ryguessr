import Coordinates from "./coordinate_type";
import RoundData from "./round-data";

interface MapOverlayProps {
  roundData?: RoundData;
  hasGuessed: boolean;
  showResults: boolean;
  mapExpanded: boolean;
  /** Tap-to-expand mini map (touch / small screens) instead of hover-to-grow */
  compact: boolean;
  /** Disables keyboard shortcuts while a dialog is open */
  inputLocked: boolean;
  handleSetMapExpanded: (mapExpanded: boolean) => void;
  handleGuess: (selectedLocation: Coordinates) => void;
}

export default MapOverlayProps;
