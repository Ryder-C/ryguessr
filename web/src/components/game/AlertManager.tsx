import { useEffect } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import AlertProps from "@/types/alert";
import { motion } from "framer-motion";

export function AutoDismissAlert({
  notification,
  duration = 4000,
  onDismiss,
}: AlertProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const joined = notification.kind === "join";
  const Icon = joined ? UserPlus : UserMinus;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="status"
      onClick={onDismiss}
      className="glass pointer-events-auto flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm"
    >
      <span
        className={`flex size-7 items-center justify-center rounded-full ${joined ? "text-black/80" : "bg-white/10 text-muted-foreground"}`}
        style={joined ? { backgroundColor: notification.color } : undefined}
      >
        <Icon className="size-3.5" />
      </span>
      <span>
        <span className="font-semibold">{notification.username}</span>
        <span className="text-muted-foreground">
          {joined ? " joined the room" : " left the room"}
        </span>
      </span>
    </motion.div>
  );
}
