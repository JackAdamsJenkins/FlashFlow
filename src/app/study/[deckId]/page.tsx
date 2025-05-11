"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { useDecks } from "@/hooks/use-decks";
import type { FlashcardType, Deck, AnimationState } from "@/types";
import { FlashcardDisplay } from "@/components/flashcard-display";
import { ChoiceModeCard } from "@/components/choice-mode-card";
import { NavigationControls } from "@/components/navigation-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TimerDisplay } from "@/components/timer-display";
import { ArrowLeftToLine, BookOpenText, Edit, Shuffle, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteCardDialog } from "@/components/dialogs/delete-card-dialog";
import { EditCardDialog } from "@/components/dialogs/edit-card-dialog";
import { AddCardDialog } from "@/components/dialogs/add-card-dialog";
import { cn } from "@/lib/utils";


const ANIMATION_DURATION = 500; // ms

interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
}

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

  // Choice Mode State
  const [studyMode, setStudyMode] = useState<'flip' | 'choice'>('flip');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [choiceAttempted, setChoiceAttempted] = useState<boolean>(false);

  // Timer State
  const [currentCardTimer, setCurrentCardTimer] = useState<number>(0);
  const [totalDeckTimer, setTotalDeckTimer] = useState<number>(0);

  const currentCard = flashcards[currentCardIndex];

  // Load deck and initialize
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
        setChoiceAttempted(false);
        setSelectedChoiceId(null);
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
        } else if (currentCardIndex < 0) {
           setCurrentCardIndex(0);
        }
      } else {
        setCurrentCardIndex(0); 
      }
    } else {
      setFlashcards([]); 
    }
  }, [currentDeck, currentCardIndex]);

  // Generate choices for Choice Mode
  const generateAndSetChoices = useCallback(() => {
    if (studyMode === 'choice' && currentCard && flashcards.length > 0) {
      if (flashcards.length < 2) {
        setChoices([]);
        if (studyMode === 'choice') { // Only toast if actively in choice mode
            toast({ title: "Not Enough Cards", description: "Choice mode requires at least 2 cards.", variant: "default" });
        }
        return;
      }

      const correctAnswer = { text: currentCard.back, isCorrect: true, id: `choice-correct-${currentCard.id}-${Date.now()}` };
      
      let incorrectAnswersPool = flashcards.filter(card => card.id !== currentCard.id);
      incorrectAnswersPool = [...incorrectAnswersPool].sort(() => 0.5 - Math.random()); // Shuffle

      const uniqueIncorrectBacks = new Set<string>();
      for (const card of incorrectAnswersPool) {
          if (card.back !== correctAnswer.text) { // Ensure incorrect is different from correct
              uniqueIncorrectBacks.add(card.back);
          }
          if (uniqueIncorrectBacks.size >= 3) break; 
      }
      
      const incorrectAnswers = Array.from(uniqueIncorrectBacks).map((back, index) => ({
          text: back,
          isCorrect: false,
          id: `choice-incorrect-${currentCard.id}-${index}-${Date.now()}`
      }));

      let finalChoices = [correctAnswer, ...incorrectAnswers];
      finalChoices = finalChoices.sort(() => 0.5 - Math.random()); // Shuffle final set
      
      setChoices(finalChoices.slice(0, 4)); // Max 4 choices
      setSelectedChoiceId(null);
      setChoiceAttempted(false);
    } else {
      setChoices([]);
    }
  }, [studyMode, currentCard, flashcards, toast]);

  useEffect(() => {
    generateAndSetChoices();
  }, [generateAndSetChoices]); // generateAndSetChoices is memoized and includes its dependencies

  // Timers
  useEffect(() => { // Total Deck Timer
    if (!currentDeck || !isDecksDataLoaded) return;
    setTotalDeckTimer(0);
    const intervalId = setInterval(() => {
      setTotalDeckTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [currentDeck, isDecksDataLoaded]);

  useEffect(() => { // Current Card Timer
    if (!currentCard) {
      setCurrentCardTimer(0);
      return;
    }
    setCurrentCardTimer(0);
    const intervalId = setInterval(() => {
      // Stop timer if choice made and in choice mode
      if (studyMode === 'choice' && choiceAttempted) {
        clearInterval(intervalId);
        return;
      }
      setCurrentCardTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [currentCard, studyMode, choiceAttempted]);


  const changeCard = useCallback((direction: "next" | "prev") => {
    if (flashcards.length === 0 || animationState !== "idle") return;

    setAnimationState("destroying");

    setTimeout(() => {
      setIsFlipped(false);
      setChoiceAttempted(false);
      setSelectedChoiceId(null);
      
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
    if (flashcards.length === 0 || animationState !== "idle" || studyMode === 'choice') return;
    setIsFlipped((prevFlipped) => !prevFlipped);
  };
  
  const handleSelectChoice = (choiceId: string) => {
    if (choiceAttempted || animationState !== "idle") return;
    setSelectedChoiceId(choiceId);
    setChoiceAttempted(true);
    const choice = choices.find(c => c.id === choiceId);
    if (choice) {
        toast({
            title: choice.isCorrect ? "Correct!" : "Incorrect",
            description: choice.isCorrect ? "Well done!" : `The correct answer was highlighted.`,
            variant: choice.isCorrect ? "default" : "destructive",
        });
    }
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
      setChoiceAttempted(false);
      setSelectedChoiceId(null);
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
      if (updatedD.flashcards.length < originalFlashcardsLength && updatedD.flashcards.length > 0) {
         if (originalIndex >= updatedD.flashcards.length) {
            setCurrentCardIndex(updatedD.flashcards.length -1);
         } else {
            setCurrentCardIndex(originalIndex); 
         }
      } else if (updatedD.flashcards.length === 0) {
        setCurrentCardIndex(0);
      }
      setIsFlipped(false);
      setChoiceAttempted(false);
      setSelectedChoiceId(null);
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
        setCurrentDeck(updatedDeck);
        toast({
          title: "Card Added",
          description: "A new card has been added to the deck.",
        });
      }
    }
    setIsAddCardDialogOpen(false);
  };
  
  const handleModeToggle = (checked: boolean) => {
    const newMode = checked ? 'choice' : 'flip';
    if (newMode === 'choice' && flashcards.length < 2) {
        toast({ title: "Choice Mode Unavailable", description: "This mode requires at least 2 cards in the deck." });
        setStudyMode('flip'); // Stay in flip mode
        return;
    }
    setStudyMode(newMode);
    setIsFlipped(false);
    setChoiceAttempted(false);
    setSelectedChoiceId(null);
    // Choices will be regenerated by useEffect watching studyMode and currentCard
  };


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
      <header className="mb-4 text-center w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
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
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 my-2 p-2 border rounded-md bg-card">
            <div className="flex items-center space-x-2">
                <Switch
                    id="study-mode-toggle"
                    checked={studyMode === 'choice'}
                    onCheckedChange={handleModeToggle}
                    disabled={isAnimating}
                    aria-label={`Switch to ${studyMode === 'flip' ? 'Choice' : 'Flip'} Mode`}
                />
                <Label htmlFor="study-mode-toggle">
                    {studyMode === 'choice' ? 'Choice Mode' : 'Flip Mode'}
                    {studyMode === 'flip' && flashcards.length < 2 && " (Needs ≥2 cards for Choice)"}
                </Label>
            </div>
            <div className="flex gap-4">
                <TimerDisplay seconds={currentCardTimer} label="Card Time" />
                <TimerDisplay seconds={totalDeckTimer} label="Total Time" />
            </div>
        </div>
      </header>

      <div className="w-full max-w-xl md:max-w-2xl">
        {flashcards.length > 0 && currentCard ? (
          <>
            <Card className={cn("shadow-xl overflow-hidden", studyMode === 'choice' ? "bg-transparent border-none shadow-none" : "")}>
              {studyMode === 'flip' && (
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
              )}
             
              <CardContent className={cn(studyMode === 'choice' ? "p-0" : "")}>
                {studyMode === 'flip' ? (
                    <FlashcardDisplay
                        frontText={currentCard.front}
                        backText={currentCard.back}
                        isFlipped={isFlipped}
                        onFlip={handleFlip}
                        animationState={animationState}
                    />
                ) : (
                    choices.length > 0 ? (
                        <ChoiceModeCard
                            frontText={currentCard.front}
                            choices={choices}
                            onSelectChoice={handleSelectChoice}
                            selectedChoiceId={selectedChoiceId}
                            choiceAttempted={choiceAttempted}
                            animationState={animationState}
                        />
                    ) : (
                         <Card className="shadow-lg "><CardContent className="p-8 text-center min-h-[20rem] flex flex-col justify-center items-center">
                            <BookOpenText size={48} className="mx-auto mb-4 text-muted-foreground" />
                            <h2 className="text-xl font-semibold mb-2">
                                {(flashcards.length < 2 && studyMode === 'choice') ? "Choice Mode Unavailable" : "Loading Choices..."}
                            </h2>
                            <p className="text-muted-foreground">
                                {(flashcards.length < 2 && studyMode === 'choice') ? "This mode requires at least 2 cards in the deck." : "Please wait or try Flip Mode."}
                            </p>
                        </CardContent></Card>
                    )
                )}
                 <NavigationControls
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onFlip={handleFlip} // Will be ignored in choice mode due to showFlipButton
                    canPrevious={flashcards.length > 1}
                    canNext={flashcards.length > 1 && (studyMode === 'flip' || (studyMode === 'choice' && choiceAttempted))} // Allow next in choice mode only after attempt
                    isFlipped={isFlipped}
                    isAnimating={isAnimating}
                    showFlipButton={studyMode === 'flip'}
                />
                 {studyMode === 'choice' && (
                    <div className="mt-4 flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => setCardToEdit(currentCard)} aria-label="Edit card" disabled={isAnimating}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCardToDelete(currentCard)} aria-label="Delete card" disabled={isAnimating}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                 )}
              </CardContent>
            </Card>
          </>
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
