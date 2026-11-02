// Room-wide settings shared with every player via `/api/config` and the `config-update` event
export default interface RoomConfig {
  panningGesturesEnabled: boolean;
  streetNamesEnabled: boolean;
  zoomGesturesEnabled: boolean;
  userNavigationEnabled: boolean;
}
