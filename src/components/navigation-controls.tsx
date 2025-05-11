"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RefreshCcw } from "lucide-react";

interface NavigationControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onFlip: () => void;
  canPrevious: boolean;
  canNext: boolean;
  isFlipped: boolean;
  isAnimating?: boolean;
  showFlipButton?: boolean;
}

export function NavigationControls({
  onPrevious,
  onNext,
  onFlip,
  canPrevious,
  canNext,
  isFlipped,
  isAnimating = false,
  showFlipButton = true,
}: NavigationControlsProps) {
  return (
    <div className="flex justify-center items-center space-x-4 mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canPrevious || isAnimating}
        aria-label="Previous card"
        aria-busy={isAnimating}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
      {showFlipButton && (
        <Button 
          onClick={onFlip} 
          aria-label={isFlipped ? "Show front" : "Show back (Flip card)"}
          disabled={isAnimating}
          aria-busy={isAnimating}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Flip Card
        </Button>
      )}
      <Button
        variant="outline"
        onClick={onNext}
        disabled={!canNext || isAnimating}
        aria-label="Next card"
        aria-busy={isAnimating}
      >
        Next <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
