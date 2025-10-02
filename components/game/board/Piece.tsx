"use client";

import { cn } from "@/lib/utils";

export default function Piece({ color }: { color: "W" | "B" }) {
  return (
    <div
      className={cn(
        "w-5 h-5 sm:w-6 sm:h-6 rounded-full border",
        color === "W"
          ? "bg-white border-neutral-300"
          : "bg-neutral-800 border-neutral-700"
      )}
    />
  );
}

