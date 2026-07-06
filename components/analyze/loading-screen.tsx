"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Info } from "lucide-react";
import { STAGE_LABELS, type StageIndex } from "@/lib/types/audit";
import { cn } from "@/lib/utils";

export function LoadingScreen({ stage, url }: { stage: StageIndex; url: string }) {
  const [isLate, setIsLate] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLate(true), 15000); // 15 seconds
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 py-16 relative">
      <div className="relative flex size-24 items-center justify-center">
        {/* Removed blur for Swiss design */}
        <motion.div
          className="absolute inset-0 rounded-none border-2 border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-3 rounded-none border-2 border-primary/40"
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
                "flex items-center gap-3 rounded-none px-4 py-3 transition-colors duration-500",
                active ? "bg-card border-2 border-border" : "bg-transparent border-2 border-transparent"
              )}
            >
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-none border-2 text-[10px] transition-colors duration-500",
                  done && "border-primary bg-primary/10 text-primary",
                  active && "border-primary bg-primary/20",
                  !done && !active && "border-border/40",
                )}
              >
                <AnimatePresence initial={false}>
                  {done ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="size-3.5" />
                    </motion.span>
                  ) : active ? (
                    <motion.span
                      key="spin"
                      className="size-2 rounded-none bg-primary"
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

      <AnimatePresence>
        {isLate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-500/10 px-4 py-2 border-l-4 border-amber-500"
          >
            <Info className="size-4" />
            Taking longer than expected. We are still analyzing...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
