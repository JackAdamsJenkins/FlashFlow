
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CsvImportButton } from "@/components/csv-import-button";
import { FlashcardDisplay } from "@/components/flashcard-display";
import { NavigationControls } from "@/components/navigation-controls";
import type { FlashcardType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpenText, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AnimationState = "idle" | "destroying" | "appearing";
const ANIMATION_DURATION = 500; // ms

export default function FlashFlowPage() {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImport = (importedFlashcards: FlashcardType[]) => {
    setFlashcards(importedFlashcards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setAnimationState("idle"); // Reset animation state on new import
  };

  const changeCard = useCallback((direction: "next" | "prev") => {
    if (flashcards.length === 0 || animationState !== "idle") return;

    setAnimationState("destroying");

    setTimeout(() => {
      setIsFlipped(false);
      if (direction === "next") {
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
      } else {
        setCurrentCardIndex((prevIndex) =>
          prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
        );
      }
      setAnimationState("appearing");

      setTimeout(() => {
        setAnimationState("idle");
      }, ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  }, [flashcards.length, animationState]);

  const handleNext = () => {
    changeCard("next");
  };

  const handlePrevious = () => {
    changeCard("prev");
  };

  const handleFlip = () => {
    if (flashcards.length === 0 || animationState !== "idle") return;
    setIsFlipped((prevFlipped) => !prevFlipped);
  };

  const handleShuffle = () => {
    if (flashcards.length <= 1 || animationState !== "idle") return;
    
    setAnimationState("destroying"); // Use similar animation for shuffle transition

    setTimeout(() => {
      const shuffledCards = [...flashcards];
      for (let i = shuffledCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
      }
      setFlashcards(shuffledCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      
      setAnimationState("appearing");
      toast({
        title: "Cards Shuffled",
        description: "The order of your flashcards has been randomized.",
      });
      setTimeout(() => {
        setAnimationState("idle");
      }, ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  };
  
  if (!isClient) {
    return null; 
  }

  const currentCard = flashcards[currentCardIndex];
  const isAnimating = animationState !== "idle";

  return (
    <main className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center">
          <BookOpenText size={48} className="mr-3 text-accent" />
          FlashFlow
        </h1>
        <p className="text-muted-foreground mt-2">Your personal flashcard learning assistant.</p>
      </header>

      <div className="w-full max-w-xl md:max-w-2xl">
        <section className="mb-8 flex justify-center space-x-4">
          <CsvImportButton onImport={handleImport} disabled={isAnimating} />
          <Button
            onClick={handleShuffle}
            disabled={flashcards.length <= 1 || isAnimating}
            variant="outline"
            aria-label="Shuffle cards"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle Cards
          </Button>
        </section>

        {flashcards.length > 0 && currentCard ? (
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground text-center">
                Card {currentCardIndex + 1} of {flashcards.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FlashcardDisplay
                frontText={currentCard.front}
                backText={currentCard.back}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                animationState={animationState}
              />
              <NavigationControls
                onPrevious={handlePrevious}
                onNext={handleNext}
                onFlip={handleFlip}
                canPrevious={flashcards.length > 1}
                canNext={flashcards.length > 1}
                isFlipped={isFlipped}
                isAnimating={isAnimating}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <BookOpenText size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No flashcards loaded</h2>
              <p className="text-muted-foreground">
                Import a CSV file with 'front' and 'back' columns to begin your learning session.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FlashFlow. Happy learning!</p>
      </footer>
    </main>
  );
}
