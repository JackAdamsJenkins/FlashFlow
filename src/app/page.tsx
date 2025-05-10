"use client";

import React, { useState, useEffect } from "react";
import { CsvImportButton } from "@/components/csv-import-button";
import { FlashcardDisplay } from "@/components/flashcard-display";
import { NavigationControls } from "@/components/navigation-controls";
import type { FlashcardType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpenText, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FlashFlowPage() {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleImport = (importedFlashcards: FlashcardType[]) => {
    setFlashcards(importedFlashcards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (flashcards.length === 0) return;

    if (isFlipped) {
      setIsFlipped(false); // First, flip the current card to front
    } else {
      // If card is already front-facing, move to the next card
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
      // isFlipped is already false, so the new card will show its front.
    }
  };

  const handlePrevious = () => {
    if (flashcards.length === 0) return;

    if (isFlipped) {
      setIsFlipped(false); // First, flip the current card to front
    } else {
      // If card is already front-facing, move to the previous card
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
      );
      // isFlipped is already false, so the new card will show its front.
    }
  };

  const handleFlip = () => {
    if (flashcards.length === 0) return;
    setIsFlipped((prevFlipped) => !prevFlipped);
  };

  const handleShuffle = () => {
    if (flashcards.length <= 1) return;

    // Fisher-Yates (Knuth) Shuffle Algorithm
    const shuffledCards = [...flashcards];
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }

    setFlashcards(shuffledCards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast({
      title: "Cards Shuffled",
      description: "The order of your flashcards has been randomized.",
    });
  };
  
  if (!isClient) {
    // Render nothing or a loading indicator on the server to avoid hydration mismatch
    return null; 
  }

  const currentCard = flashcards[currentCardIndex];

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
          <CsvImportButton onImport={handleImport} />
          <Button
            onClick={handleShuffle}
            disabled={flashcards.length <= 1}
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
              />
              <NavigationControls
                onPrevious={handlePrevious}
                onNext={handleNext}
                onFlip={handleFlip}
                canPrevious={flashcards.length > 1 || isFlipped} // Can "previous" if it just means flipping back
                canNext={flashcards.length > 1 || isFlipped}     // Can "next" if it just means flipping back
                isFlipped={isFlipped}
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