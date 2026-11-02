import { useLoadScript } from "@react-google-maps/api";
import { GameView } from "../game/GameView";
import { LoadingScreen } from "./loading-screen";

const GoogleMapLoader = ({ APIKEY }: { APIKEY: string }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: APIKEY,
  });

  if (loadError) {
    return (
      <LoadingScreen error="Google Maps failed to load. Try refreshing." />
    );
  }
  if (!isLoaded) {
    return <LoadingScreen message="Loading maps…" />;
  }
  return <GameView />;
};

export default GoogleMapLoader;
