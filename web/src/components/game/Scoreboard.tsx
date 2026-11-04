"use client";
import NumberFlow, { continuous } from "@number-flow/react";
import ScoreData from "@/types/score-data";
import { memo, useMemo } from "react";
import { CSSProperties, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isConfirmKey, shouldIgnoreHotkey } from "@/lib/hotkeys";
import { useGameSession } from "@/store/useSettingsStore";

export const Scoreboard = memo(function Scoreboard({
  roundNumber,
  score_data,
  hasContinued,
  onContinue,
  onClose,
}: {
  roundNumber: number;
  score_data: ScoreData;
  hasContinued: boolean;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [animateToRealScore, setAnimateToRealScore] = useState(false);
  const username = useGameSession((state) => state.activeUsername);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateToRealScore(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreHotkey(e)) return;
      if (e.key === "Escape") onClose();
      if (isConfirmKey(e) && !hasContinued) {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasContinued, onContinue, onClose]);

  // Show last round's standings first, then let rows slide into the new order
  const rows = useMemo(() => {
    const previous = (s: (typeof score_data.player_scores)[number]) =>
      s.cum_score - s.last_score;
    return [...score_data.player_scores].sort((a, b) =>
      animateToRealScore
        ? b.cum_score - a.cum_score
        : previous(b) - previous(a),
    );
  }, [score_data, animateToRealScore]);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-label="Standings"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[85dvh] w-full max-w-md flex-col gap-3 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Standings
            <span className="font-normal text-muted-foreground">
              {" "}
              · Round {roundNumber}
            </span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground"
          >
            <ArrowLeft />
            Map
          </Button>
        </div>

        <ol className="-mx-1 flex flex-col gap-0.5 overflow-y-auto px-1">
          {rows.map((score) => {
            const isMe = score.name === username;
            // Tied players share a rank
            const shown = (s: typeof score) =>
              animateToRealScore ? s.cum_score : s.cum_score - s.last_score;
            const rank = rows.filter((r) => shown(r) > shown(score)).length;
            return (
              <motion.li
                layout
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                key={score.name}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isMe ? "bg-white/[0.07]" : ""}`}
              >
                <span className="w-4 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {rank + 1}
                </span>
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: score.IconColor }}
                />
                <span className="flex min-w-0 flex-1 gap-1 font-medium">
                  <span className="truncate">{score.name}</span>
                  {isMe && (
                    <span className="shrink-0 font-normal text-muted-foreground">
                      (you)
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  +{score.last_score.toLocaleString()}
                </span>
                <NumberFlow
                  className="w-14 shrink-0 text-right font-semibold tabular-nums"
                  plugins={[continuous]}
                  value={
                    animateToRealScore
                      ? score.cum_score
                      : score.cum_score - score.last_score || 0
                  }
                  style={
                    { "--number-flow-mask-height": "0.3em" } as CSSProperties
                  }
                />
              </motion.li>
            );
          })}
        </ol>

        <Button
          onClick={onContinue}
          disabled={hasContinued}
          className="h-11 w-full rounded-xl font-semibold"
        >
          {hasContinued ? (
            <>
              <Loader2 className="animate-spin" />
              Waiting for other players…
            </>
          ) : (
            <>
              Next round
              <ArrowRight />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
});
