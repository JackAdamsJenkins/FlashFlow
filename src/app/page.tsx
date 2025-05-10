"use client";

import React, { useState, useEffect } from "react";
import { CsvImportButton } from "@/components/csv-import-button";
import { FlashcardDisplay } from "@/components/flashcard-display";
import { NavigationControls } from "@/components/navigation-controls";
import type { FlashcardType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText } from "lucide-react";

export default function FlashFlowPage() {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    if (flashcards.length === 0) return;
    setCurrentCardIndex((prevIndex) =>
      prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
    );
    setIsFlipped(false);
  };

  const handleFlip = () => {
    if (flashcards.length === 0) return;
    setIsFlipped((prevFlipped) => !prevFlipped);
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
        <section className="mb-8 flex justify-center">
          <CsvImportButton onImport={handleImport} />
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
                canPrevious={flashcards.length > 1}
                canNext={flashcards.length > 1}
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
