"use client";

import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/lib/store/game";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { RotateCcw, Cpu, ExternalLink } from "lucide-react";

export default function GameToolbar() {
  const mode = useGameStore((s) => s.mode);
  const playerSide = useGameStore((s) => s.playerSide);
  const aiStrategy = useGameStore((s) => s.aiStrategy);
  const setMode = useGameStore((s) => s.setMode);
  const setPlayerSide = useGameStore((s) => s.setPlayerSide);
  const setAIStrategy = useGameStore((s) => s.setAIStrategy);
  const reset = useGameStore((s) => s.reset);
  const aiStep = useGameStore((s) => s.aiStep);
  const status = useGameStore((s) => s.status);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="flex items-center gap-2">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "ai" | "local")}
          >
            <TabsList className="h-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <TabsTrigger value="ai" disabled={status !== "setup"}>
                      AI
                    </TabsTrigger>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {status === "setup"
                      ? "Play against AI"
                      : "Finish or reset to change mode"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <TabsTrigger value="local" disabled={status !== "setup"}>
                      1v1
                    </TabsTrigger>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {status === "setup"
                      ? "Two players on one PC"
                      : "Finish or reset to change mode"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
          {mode === "ai" && (
            <>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>AI Strategy:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={aiStrategy === "mine" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAIStrategy("mine")}
                        disabled={status !== "setup"}
                        className="flex items-center gap-1"
                      >
                        <Cpu className="h-3 w-3" />
                        Mine
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {status === "setup"
                        ? "My enhanced AI with runner detection"
                        : "Finish or reset to change strategy"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={
                          aiStrategy === "dapetcu21-minimax"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setAIStrategy("dapetcu21-minimax")}
                        disabled={status !== "setup"}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        dapetcu21-minimax
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div>
                      <p>
                        {status === "setup"
                          ? "Minimax by dapetcu21"
                          : "Finish or reset to change strategy"}
                      </p>
                      {status === "setup" && (
                        <a
                          href="https://github.com/dapetcu21/breakthrough-ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline text-xs mt-1 inline-block"
                        >
                          View original Lua implementation →
                        </a>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={
                          aiStrategy === "dapetcu21-montecarlo"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setAIStrategy("dapetcu21-montecarlo")}
                        disabled={status !== "setup"}
                        className="flex items-center gap-1"
                      >
                        <Cpu className="h-3 w-3" />
                        dapetcu21-montecarlo
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {status === "setup"
                        ? "Monte Carlo Tree Search by dapetcu21"
                        : "Finish or reset to change strategy"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Play as:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={playerSide === "W" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerSide("W")}
                        disabled={status !== "setup"}
                      >
                        White
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {status === "setup"
                        ? "Play as White"
                        : "Finish or reset to change side"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={playerSide === "B" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerSide("B")}
                        disabled={status !== "setup"}
                      >
                        Black
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {status === "setup"
                        ? "Play as Black"
                        : "Finish or reset to change side"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => aiStep()}
                  disabled={status !== "playing"}
                >
                  {aiStrategy === "mine" ? (
                    <>
                      <Cpu className="h-3 w-3 mr-1" />
                      My AI
                    </>
                  ) : aiStrategy === "dapetcu21-montecarlo" ? (
                    <>
                      <Cpu className="h-3 w-3 mr-1" />
                      dapetcu21-MC
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      dapetcu21-MM
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {aiStrategy === "mine"
                  ? "Let my AI move for the current side (A)"
                  : aiStrategy === "dapetcu21-montecarlo"
                  ? "Let dapetcu21's Monte Carlo AI move for the current side (A)"
                  : "Let dapetcu21's minimax AI move for the current side (A)"}
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reset"
                onClick={() => reset()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset (R)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
