"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardDisplayProps {
  frontText: string;
  backText: string;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

export function FlashcardDisplay({
  frontText,
  backText,
  isFlipped,
  onFlip,
  className,
}: FlashcardDisplayProps) {
  return (
    <div
      className={cn("flashcard-container w-full h-80 md:h-96 cursor-pointer", className)}
      onClick={onFlip}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFlip();}}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard. Front: ${frontText}. Click or press Enter to flip.`}
    >
      <div className={cn("flashcard-inner", { "is-flipped": isFlipped })}>
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
