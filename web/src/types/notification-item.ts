export default interface NotificationItem {
  id: string;
  kind: "join" | "leave";
  username: string;
  color?: string;
}
