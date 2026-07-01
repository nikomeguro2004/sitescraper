"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { STAGE_LABELS, type StageIndex } from "@/lib/types/audit";
import { cn } from "@/lib/utils";

export function LoadingScreen({ stage, url }: { stage: StageIndex; url: string }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 py-16">
      <div className="relative flex size-24 items-center justify-center">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border border-primary/40"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">Analyzing</p>
        <p className="max-w-sm truncate text-base font-medium">{url}</p>
      </div>

      <div className="flex w-full flex-col gap-1">
        {STAGE_LABELS.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-500",
                active ? "bg-card border border-border/50 shadow-lg shadow-black/5" : "bg-transparent border border-transparent"
              )}
            >
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors duration-500",
                  done && "border-primary/40 bg-primary/10 text-primary",
                  active && "border-primary/60 bg-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                  !done && !active && "border-border/40",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {done ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="size-3.5" />
                    </motion.span>
                  ) : active ? (
                    <motion.span
                      key="spin"
                      className="size-2 rounded-full bg-primary"
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
              <span className={cn("text-sm transition-colors duration-500", active ? "font-semibold text-foreground" : done ? "text-foreground/80" : "text-muted-foreground/60")}>
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
