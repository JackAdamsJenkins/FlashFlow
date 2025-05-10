"use client";

import React from "react";
import { cn } from "@/lib/utils";

type AnimationState = "idle" | "destroying" | "appearing";

interface FlashcardDisplayProps {
  frontText: string;
  backText: string;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
  animationState?: AnimationState;
}

export function FlashcardDisplay({
  frontText,
  backText,
  isFlipped,
  onFlip,
  className,
  animationState = "idle",
}: FlashcardDisplayProps) {
  const handleInteraction = () => {
    if (animationState === "idle") {
      onFlip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (animationState === "idle" && (e.key === 'Enter' || e.key === ' ')) {
      onFlip();
    }
  };

  return (
    <div
      className={cn(
        "flashcard-container w-full h-80 md:h-96",
        animationState === "idle" ? "cursor-pointer" : "cursor-default",
        {
          "card-destroy-active": animationState === "destroying",
          "card-appear-active": animationState === "appearing",
        },
        className
      )}
      onClick={handleInteraction}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={animationState === "idle" ? 0 : -1}
      aria-label={`Flashcard. Front: ${frontText}. ${animationState === 'idle' ? 'Click or press Enter to flip.' : 'Animation in progress.'}`}
      aria-live={animationState !== "idle" ? "polite" : undefined} // Announce animation state changes
    >
      <div className={cn("flashcard-inner", { "is-flipped": isFlipped && animationState !== "destroying" })}>
        <div className="flashcard-face flashcard-front">
          <p className="text-xl md:text-2xl whitespace-pre-line">{frontText}</p>
        </div>
        <div className="flashcard-face flashcard-back">
          <p className="text-xl md:text-2xl whitespace-pre-line">{backText}</p>
        </div>
      </div>
    </div>
  );
}
