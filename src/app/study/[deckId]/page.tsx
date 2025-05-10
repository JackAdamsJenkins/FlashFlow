
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
import { ArrowLeftToLine, BookOpenText, Edit, Shuffle, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteCardDialog } from "@/components/dialogs/delete-card-dialog";
import { EditCardDialog } from "@/components/dialogs/edit-card-dialog";
import { AddCardDialog } from "@/components/dialogs/add-card-dialog";


type AnimationState = "idle" | "destroying" | "appearing";
const ANIMATION_DURATION = 500; // ms

export default function StudyDeckPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = typeof params.deckId === 'string' ? params.deckId : '';
  
  const { getDeckById, updateDeck, deleteCardFromDeck, updateCardInDeck, addCardToDeck, isLoaded: isDecksDataLoaded } = useDecks();
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const { toast } = useToast();

  const [cardToDelete, setCardToDelete] = useState<FlashcardType | null>(null);
  const [cardToEdit, setCardToEdit] = useState<FlashcardType | null>(null);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);

  useEffect(() => {
    if (!isDecksDataLoaded) { 
      setCurrentDeck(null); 
      return;
    }

    if (deckId) {
      const deck = getDeckById(deckId);
      if (deck) {
        setCurrentDeck(deck);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      } else {
        toast({
          variant: "destructive",
          title: "Deck not found",
          description: "The requested deck could not be loaded.",
        });
        setCurrentDeck(null); 
        router.push('/'); 
      }
    } else {
      setCurrentDeck(null);
    }
  }, [deckId, getDeckById, router, toast, isDecksDataLoaded]);

   useEffect(() => {
    if (currentDeck) {
      setFlashcards(currentDeck.flashcards);
      if (currentDeck.flashcards.length > 0) {
        if (currentCardIndex >= currentDeck.flashcards.length) {
          setCurrentCardIndex(currentDeck.flashcards.length - 1);
        } else if (currentCardIndex < 0) { // Ensure index is not negative if all cards are deleted then one is added
           setCurrentCardIndex(0);
        }
      } else {
        setCurrentCardIndex(0); 
      }
    } else {
      setFlashcards([]); 
    }
  }, [currentDeck, currentCardIndex]);


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
      const updatedD = updateDeck(currentDeck.id, { flashcards: shuffled });
      if (updatedD) setCurrentDeck(updatedD); 
      
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
    const originalIndex = currentCardIndex;
    const originalFlashcardsLength = currentDeck.flashcards.length;

    const updatedD = deleteCardFromDeck(currentDeck.id, cardId);
    if (updatedD) {
      setCurrentDeck(updatedD); 
      // setCurrentDeck will trigger the useEffect to update flashcards and potentially currentCardIndex
      // If the deleted card was the current one, and it wasn't the only card,
      // try to stay on the "same" visual position or move to previous if it was last
      if (updatedD.flashcards.length < originalFlashcardsLength && updatedD.flashcards.length > 0) {
         if (originalIndex >= updatedD.flashcards.length) { // If last card was deleted
            setCurrentCardIndex(updatedD.flashcards.length -1);
         } else {
            setCurrentCardIndex(originalIndex); // Stay at current index if possible (new card takes its place)
         }
      } else if (updatedD.flashcards.length === 0) {
        setCurrentCardIndex(0);
      }
      setIsFlipped(false);
      toast({ title: "Card Deleted" });
    }
    setCardToDelete(null);
  };

  const handleUpdateCard = (cardId: string, front: string, back: string) => {
    if (!currentDeck) return;
    const updatedD = updateCardInDeck(currentDeck.id, cardId, { front, back });
     if (updatedD) {
      setCurrentDeck(updatedD); 
      toast({ title: "Card Updated" });
    }
    setCardToEdit(null);
  };

  const handleAddCardConfirm = (front: string, back: string) => {
    if (currentDeck) {
      const updatedDeck = addCardToDeck(currentDeck.id, { front, back });
      if (updatedDeck) {
        setCurrentDeck(updatedDeck); // This will trigger useEffect to update flashcards
        toast({
          title: "Card Added",
          description: "A new card has been added to the deck.",
        });
      }
    }
    setIsAddCardDialogOpen(false);
  };

  const currentCard = flashcards[currentCardIndex];
  const isAnimating = animationState !== "idle";

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

  return (
    <main className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8 text-center w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" passHref>
            <Button variant="outline" size="sm">
              <ArrowLeftToLine className="mr-2 h-4 w-4" /> Decks
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-primary truncate px-2 sm:px-4 flex-shrink min-w-0">
            {currentDeck ? currentDeck.name : "Deck"}
          </h1>
           <div className="flex gap-2 flex-shrink-0">
            <Button onClick={() => setIsAddCardDialogOpen(true)} variant="outline" size="sm" disabled={!currentDeck || isAnimating}>
              <PlusCircle className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Card</span>
            </Button>
            <Button onClick={handleShuffle} disabled={flashcards.length <= 1 || isAnimating} variant="outline" size="sm">
              <Shuffle className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Shuffle</span>
            </Button>
           </div>
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
                  ? "This deck has no flashcards. Click 'Add Card' to add new cards."
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
      {isAddCardDialogOpen && (
        <AddCardDialog
          isOpen={isAddCardDialogOpen}
          onOpenChange={setIsAddCardDialogOpen}
          onConfirmAdd={handleAddCardConfirm}
        />
      )}

      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FlashFlow. Happy learning!</p>
      </footer>
    </main>
  );
}

