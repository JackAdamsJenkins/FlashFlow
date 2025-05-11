"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnimationState } from "@/types";

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ChoiceModeCardProps {
  frontText: string;
  choices: Choice[];
  onSelectChoice: (choiceId: string) => void;
  selectedChoiceId: string | null;
  choiceAttempted: boolean;
  animationState?: AnimationState;
  className?: string;
}

export function ChoiceModeCard({
  frontText,
  choices,
  onSelectChoice,
  selectedChoiceId,
  choiceAttempted,
  animationState = "idle",
  className,
}: ChoiceModeCardProps) {
  
  const getButtonVariant = (choice: Choice): "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined => {
    if (choiceAttempted) {
      if (choice.isCorrect) return "default"; // Correct answer
      if (choice.id === selectedChoiceId && !choice.isCorrect) return "destructive"; // Incorrect selected answer
    }
    return "outline"; // Default or unselected
  };
  
  const getButtonTextColor = (choice: Choice): string => {
    if (choiceAttempted) {
      if (choice.isCorrect) return "text-primary-foreground"; 
      if (choice.id === selectedChoiceId && !choice.isCorrect) return "text-destructive-foreground";
    }
    return ""; 
  }

  return (
    <div
      className={cn(
        "flashcard-container w-full min-h-[24rem] md:min-h-[26rem] flex flex-col", // Adjusted min-height
        {
          "card-destroy-active": animationState === "destroying",
          "card-appear-active": animationState === "appearing",
        },
        className
      )}
    >
      <Card className="flex-grow flex flex-col shadow-lg">
        <CardContent className="p-6 flex-grow flex flex-col items-center justify-center text-center">
          <p className="text-xl md:text-2xl mb-6 whitespace-pre-line">{frontText}</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {choices.map((choice) => (
          <Button
            key={choice.id}
            variant={getButtonVariant(choice)}
            className={cn("w-full justify-start text-left p-4 h-auto min-h-[3.5rem] whitespace-normal break-words", getButtonTextColor(choice))}
            onClick={() => onSelectChoice(choice.id)}
            disabled={choiceAttempted || animationState !== "idle"}
            aria-pressed={selectedChoiceId === choice.id}
          >
            {choice.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
