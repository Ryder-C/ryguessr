"use client";
import NumberFlow, { continuous } from "@number-flow/react";
import ScoreData from "@/types/score-data";
import { memo, useMemo } from "react";
import { CSSProperties, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/format";
import { isConfirmKey, shouldIgnoreHotkey } from "@/lib/hotkeys";
import { useGameSession } from "@/store/useSettingsStore";

const RANK_STYLES = [
  "bg-gold text-black",
  "bg-silver text-black",
  "bg-bronze text-black",
];

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
        className="glass flex max-h-[85dvh] w-full max-w-lg flex-col gap-4 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              After round {roundNumber}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Standings</h2>
          </div>
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

        <ol className="-mx-1 flex flex-col gap-1.5 overflow-y-auto px-1">
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isMe ? "bg-primary/10 ring-1 ring-primary/40" : "bg-white/[0.04]"}`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${RANK_STYLES[rank] ?? "bg-white/10 text-muted-foreground"}`}
                >
                  {rank + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-2 ring-white/20"
                      style={{ backgroundColor: score.IconColor }}
                    />
                    <span className="truncate">{score.name}</span>
                    {isMe && (
                      <span className="shrink-0 rounded bg-primary/20 px-1.5 py-px text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                        You
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDistance(score.distance)} away
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <NumberFlow
                    className="text-lg leading-tight font-bold tabular-nums"
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
                  <span className="text-xs font-semibold tabular-nums text-primary">
                    +{score.last_score.toLocaleString()}
                  </span>
                </div>
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
