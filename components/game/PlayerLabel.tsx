"use client";

import { cn } from "@/lib/utils";

export default function PlayerLabel({
  color,
  label,
  active,
}: {
  color: "W" | "B";
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "text-xs sm:text-sm text-muted-foreground select-none",
        active && "text-foreground underline decoration-2 underline-offset-4"
      )}
    >
      {color === "B" ? "Black" : "White"}: {label}
    </div>
  );
}

