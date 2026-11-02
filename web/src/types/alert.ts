import NotificationItem from "./notification-item";

export default interface AlertProps {
  notification: NotificationItem;
  duration?: number;
  onDismiss?: () => void;
}
