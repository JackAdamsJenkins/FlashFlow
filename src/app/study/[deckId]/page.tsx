"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation'; // Use next/navigation for App Router
import Link from "next/link";
import { useDecks } from "@/hooks/use-decks";
import type { FlashcardType, Deck } from "@/types";
import { FlashcardDisplay } from "@/components/flashcard-display";
import { NavigationControls } from "@/components/navigation-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftToLine, BookOpenText, Edit, Shuffle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteCardDialog } from "@/components/dialogs/delete-card-dialog";
import { EditCardDialog } from "@/components/dialogs/edit-card-dialog";


type AnimationState = "idle" | "destroying" | "appearing";
const ANIMATION_DURATION = 500; // ms

export default function StudyDeckPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = typeof params.deckId === 'string' ? params.deckId : '';
  
  const { getDeckById, updateDeck, deleteCardFromDeck, updateCardInDeck, isLoaded: isDecksDataLoaded } = useDecks();
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const { toast } = useToast();

  const [cardToDelete, setCardToDelete] = useState<FlashcardType | null>(null);
  const [cardToEdit, setCardToEdit] = useState<FlashcardType | null>(null);

  useEffect(() => {
    if (!isDecksDataLoaded) { // Wait for useDecks to finish loading its data
      setCurrentDeck(null); // Ensure currentDeck is null while hook is loading
      return;
    }

    if (deckId) {
      const deck = getDeckById(deckId);
      if (deck) {
        setCurrentDeck(deck);
        // Flashcards will be set by the other useEffect that depends on currentDeck
        setCurrentCardIndex(0);
        setIsFlipped(false);
      } else {
        toast({
          variant: "destructive",
          title: "Deck not found",
          description: "The requested deck could not be loaded.",
        });
        setCurrentDeck(null); // Ensure currentDeck is null if not found
        router.push('/'); // Redirect to home if deck not found
      }
    } else {
      // No deckId, or decks not loaded yet
      setCurrentDeck(null);
    }
  }, [deckId, getDeckById, router, toast, isDecksDataLoaded]);

  // Update flashcards in state if the deck's flashcards change (e.g. after edit/delete or initial load)
   useEffect(() => {
    if (currentDeck) {
      setFlashcards(currentDeck.flashcards);
      // Adjust currentCardIndex if it's out of bounds after a deletion or if deck is empty
      if (currentDeck.flashcards.length > 0) {
        if (currentCardIndex >= currentDeck.flashcards.length) {
          setCurrentCardIndex(currentDeck.flashcards.length - 1);
        }
      } else {
        setCurrentCardIndex(0); // No cards, index is 0
      }
    } else {
      setFlashcards([]); // No current deck, no flashcards
    }
  }, [currentDeck, currentCardIndex]); // currentCardIndex is included to re-evaluate if it was out of bounds


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

  const handleNext = () => changeCard("next");
  const handlePrevious = () => changeCard("prev");

  const handleFlip = () => {
    if (flashcards.length === 0 || animationState !== "idle") return;
    setIsFlipped((prevFlipped) => !prevFlipped);
  };

  const handleShuffle = () => {
    if (flashcards.length <= 1 || animationState !== "idle" || !currentDeck) return;
    
    setAnimationState("destroying");

    setTimeout(() => {
      const shuffled = [...flashcards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Update deck in localStorage through useDecks hook
      const updatedD = updateDeck(currentDeck.id, { flashcards: shuffled });
      if (updatedD) setCurrentDeck(updatedD); // This will trigger flashcard state update via useEffect
      
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setAnimationState("appearing");

      toast({
        title: "Cards Shuffled",
        description: "The order of cards in this deck has been randomized.",
      });
      setTimeout(() => setAnimationState("idle"), ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!currentDeck) return;
    const updatedD = deleteCardFromDeck(currentDeck.id, cardId);
    if (updatedD) {
      setCurrentDeck(updatedD); // This will trigger the useEffect to update flashcards state
      toast({ title: "Card Deleted" });
    }
    setCardToDelete(null);
  };

  const handleUpdateCard = (cardId: string, front: string, back: string) => {
    if (!currentDeck) return;
    const updatedD = updateCardInDeck(currentDeck.id, cardId, { front, back });
     if (updatedD) {
      setCurrentDeck(updatedD); // This will trigger the useEffect to update flashcards state
      toast({ title: "Card Updated" });
    }
    setCardToEdit(null);
  };

  const currentCard = flashcards[currentCardIndex];
  const isAnimating = animationState !== "idle";

  // Display loading state if decks data isn't loaded yet OR if currentDeck is null (e.g. deckId invalid, or not found after load)
  // but avoid showing loading if we are about to redirect.
  if (!isDecksDataLoaded && !currentDeck) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
        <BookOpenText size={64} className="mb-4 text-muted-foreground animate-pulse" />
        <p className="text-xl text-muted-foreground">Loading deck...</p>
         <Link href="/" passHref className="mt-8">
          <Button variant="outline">
            <ArrowLeftToLine className="mr-2 h-4 w-4" /> Back to Decks
          </Button>
        </Link>
      </main>
    );
  }
  // If isDecksDataLoaded is true, but currentDeck is still null, it means deckId was invalid or deck not found.
  // The useEffect would have shown a toast and started a redirect. In this brief moment,
  // or if router.push hasn't completed, we might fall through.
  // Showing "Deck is Empty" or letting the main content render (which will then show "Deck is Empty") is fine.

  return (
    <main className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8 text-center w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" passHref>
            <Button variant="outline" size="sm">
              <ArrowLeftToLine className="mr-2 h-4 w-4" /> Decks
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-primary truncate px-4">
            {currentDeck ? currentDeck.name : "Deck"}
          </h1>
           <Button onClick={handleShuffle} disabled={flashcards.length <= 1 || isAnimating} variant="outline" size="sm">
            <Shuffle className="mr-2 h-4 w-4" /> Shuffle
          </Button>
        </div>
      </header>

      <div className="w-full max-w-xl md:max-w-2xl">
        {flashcards.length > 0 && currentCard ? (
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row justify-between items-center">
              <CardTitle className="text-sm text-muted-foreground text-center">
                Card {currentCardIndex + 1} of {flashcards.length}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCardToEdit(currentCard)} aria-label="Edit card" disabled={isAnimating}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCardToDelete(currentCard)} aria-label="Delete card" disabled={isAnimating}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
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
              <h2 className="text-xl font-semibold mb-2">
                {currentDeck ? "Deck is Empty" : "Deck Not Loaded"}
              </h2>
              <p className="text-muted-foreground">
                {currentDeck 
                  ? "This deck has no flashcards. You can add cards by editing the deck (feature coming soon) or re-importing."
                  : "The deck could not be loaded or does not exist."
                }
              </p>
               <Link href="/" passHref className="mt-4 inline-block">
                  <Button variant="outline">
                    <ArrowLeftToLine className="mr-2 h-4 w-4" /> Back to Decks
                  </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {cardToDelete && (
        <DeleteCardDialog
          isOpen={!!cardToDelete}
          onOpenChange={() => setCardToDelete(null)}
          card={cardToDelete}
          onConfirmDelete={() => handleDeleteCard(cardToDelete.id)}
        />
      )}
      {cardToEdit && (
         <EditCardDialog
            isOpen={!!cardToEdit}
            onOpenChange={() => setCardToEdit(null)}
            card={cardToEdit}
            onConfirmUpdate={handleUpdateCard}
        />
      )}

      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FlashFlow. Happy learning!</p>
      </footer>
    </main>
  );
}

