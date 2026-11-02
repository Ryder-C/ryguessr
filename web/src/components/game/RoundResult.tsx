"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import PlayerResults from "@/types/player-results";
import { formatDistance, MAX_ROUND_SCORE } from "@/lib/format";
import { isConfirmKey, shouldIgnoreHotkey } from "@/lib/hotkeys";

function verdict(score: number) {
  if (score >= 4900) return { text: "Pinpoint!", className: "text-primary" };
  if (score >= 4000)
    return { text: "Excellent guess", className: "text-primary" };
  if (score >= 2500) return { text: "Nice one", className: "text-primary" };
  if (score >= 1000) return { text: "Not bad", className: "text-gold" };
  return { text: "Way off", className: "text-destructive" };
}

export const RoundResult = ({
  roundNumber,
  result,
  onShowStandings,
}: {
  roundNumber: number;
  result?: PlayerResults;
  onShowStandings: () => void;
}) => {
  const score = result?.round_score ?? 0;
  const { text: verdictText, className: verdictClass } = verdict(score);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreHotkey(e)) return;
      if (isConfirmKey(e)) {
        e.preventDefault();
        onShowStandings();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onShowStandings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.3 } }}
      exit={{ opacity: 0, y: 40, transition: { duration: 0.15 } }}
      className="absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg"
    >
      <div className="glass flex flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Round {roundNumber}
          </span>
          <span className={`text-sm font-medium ${verdictClass}`}>
            {verdictText}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-4xl font-bold tabular-nums tracking-tight">
              <NumberFlow value={score} />
            </span>
            <span className="text-sm text-muted-foreground">points</span>
          </div>
          {result && (
            <div className="flex flex-col items-end text-right">
              <span className="text-xl font-semibold tabular-nums">
                {formatDistance(result.distance)}
              </span>
              <span className="text-sm text-muted-foreground">from target</span>
            </div>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${(score / MAX_ROUND_SCORE) * 100}%`,
              transition: { delay: 0.45, duration: 0.8, ease: "easeOut" },
            }}
          />
        </div>
        <Button
          onClick={onShowStandings}
          className="h-11 w-full rounded-xl font-semibold"
        >
          <Trophy />
          View standings
        </Button>
      </div>
    </motion.div>
  );
};
