"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/game";

export function useGlobalHotkeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = useGameStore.getState();
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        s.undo();
        return;
      }
      
      if (
        (isMeta && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
        (isMeta && (e.key === "y" || e.key === "Y"))
      ) {
        e.preventDefault();
        s.redo();
        return;
      }
      
      if (!isMeta && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        s.reset();
        return;
      }
      
      if (!isMeta && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        const now = useGameStore.getState();
        if (now.status === "setup") now.setMode(now.mode === "ai" ? "local" : "ai");
        return;
      }
      
      if (!isMeta && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        s.aiStep();
        return;
      }
      
      if (!isMeta && e.key === "Enter") {
        e.preventDefault();
        const now = useGameStore.getState();
        if (now.status === "setup") now.start();
        return;
      }
      
      if (!isMeta && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        const now = useGameStore.getState();
        if (now.status === "setup" && now.mode === "ai") {
          now.setPlayerSide(now.playerSide === "W" ? "B" : "W");
        }
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

