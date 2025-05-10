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
}

export function NavigationControls({
  onPrevious,
  onNext,
  onFlip,
  canPrevious,
  canNext,
  isFlipped,
}: NavigationControlsProps) {
  return (
    <div className="flex justify-center items-center space-x-4 mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canPrevious}
        aria-label="Previous card"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
      <Button onClick={onFlip} aria-label={isFlipped ? "Show front" : "Show back (Flip card)"}>
        <RefreshCcw className="mr-2 h-4 w-4" /> Flip Card
      </Button>
      <Button
        variant="outline"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next card"
      >
        Next <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
