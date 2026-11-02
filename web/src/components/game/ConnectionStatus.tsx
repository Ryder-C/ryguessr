"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export type Connection = "open" | "reconnecting" | "lost";

export const ConnectionStatus = ({
  connection,
}: {
  connection: Connection;
}) => (
  <AnimatePresence>
    {connection === "reconnecting" && (
      <motion.div
        key="reconnecting"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="pointer-events-none absolute inset-x-0 top-16 z-[70] flex justify-center sm:top-20"
      >
        <span className="glass flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Reconnecting…
        </span>
      </motion.div>
    )}
    {connection === "lost" && (
      <motion.div
        key="lost"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
      >
        <div
          role="alertdialog"
          aria-label="Connection lost"
          className="glass flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl p-6 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <WifiOff className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Connection lost</h2>
            <p className="text-sm text-muted-foreground">
              The server lost track of this session. Rejoin to keep playing.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="h-11 w-full rounded-xl font-semibold"
          >
            <RefreshCw />
            Rejoin
          </Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
