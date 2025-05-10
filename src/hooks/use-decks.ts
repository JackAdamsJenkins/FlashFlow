
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Deck, FlashcardType } from '@/types';

const LOCAL_STORAGE_KEY = 'flashflow_decks';

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface UseDecksOutput {
  decks: Deck[];
  setDecks: Dispatch<SetStateAction<Deck[]>>; // Expose setDecks for more complex direct manipulations if needed
  isLoaded: boolean;
  addDeck: (name: string, flashcards: FlashcardType[]) => Deck;
  getDeckById: (id: string) => Deck | undefined;
  updateDeck: (id: string, updates: Partial<Omit<Deck, 'id' | 'createdAt' | 'flashcards'>> & { flashcards?: FlashcardType[] }) => Deck | undefined;
  deleteDeck: (id: string) => void;
  addCardToDeck: (deckId: string, cardData: { front: string; back: string }) => Deck | undefined;
  updateCardInDeck: (deckId: string, cardId: string, updates: { front?: string; back?: string }) => Deck | undefined;
  deleteCardFromDeck: (deckId: string, cardId: string) => Deck | undefined;
}

export function useDecks(): UseDecksOutput {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedDecks = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDecks) {
        setDecks(JSON.parse(storedDecks));
      }
    } catch (error) {
      console.error("Failed to load decks from localStorage:", error);
      // Optionally, clear corrupted data or set to default
      // localStorage.removeItem(LOCAL_STORAGE_KEY); 
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(decks));
      } catch (error) {
        console.error("Failed to save decks to localStorage:", error);
      }
    }
  }, [decks, isLoaded]);

  const addDeck = useCallback((name: string, flashcards: FlashcardType[]): Deck => {
    const newDeck: Deck = {
      id: generateId('deck'),
      name,
      flashcards: flashcards.map((card, index) => ({ ...card, id: card.id || generateId(`card-${index}`) })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDecks((prevDecks) => [...prevDecks, newDeck]);
    return newDeck;
  }, []);

  const getDeckById = useCallback((id: string): Deck | undefined => {
    return decks.find(deck => deck.id === id);
  }, [decks]);

  const updateDeck = useCallback((id: string, updates: Partial<Omit<Deck, 'id' | 'createdAt' | 'flashcards'>> & { flashcards?: FlashcardType[] }): Deck | undefined => {
    let updatedDeck: Deck | undefined;
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id === id) {
          updatedDeck = {
            ...deck,
            ...updates,
            name: updates.name ?? deck.name, // Ensure name is not accidentally cleared if not provided
            flashcards: updates.flashcards ?? deck.flashcards, // Allow updating flashcards array
            updatedAt: Date.now(),
          };
          return updatedDeck;
        }
        return deck;
      })
    );
    return updatedDeck;
  }, []);

  const deleteDeck = useCallback((id: string): void => {
    setDecks((prevDecks) => prevDecks.filter(deck => deck.id !== id));
  }, []);

  const addCardToDeck = useCallback((deckId: string, cardData: { front: string; back: string }): Deck | undefined => {
    const newCard: FlashcardType = {
      id: generateId('card'),
      front: cardData.front,
      back: cardData.back,
    };
    let targetDeck: Deck | undefined;
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id === deckId) {
          targetDeck = {
            ...deck,
            flashcards: [...deck.flashcards, newCard],
            updatedAt: Date.now(),
          };
          return targetDeck;
        }
        return deck;
      })
    );
    return targetDeck;
  }, []);
  
  const updateCardInDeck = useCallback((deckId: string, cardId: string, updates: { front?: string; back?: string }): Deck | undefined => {
    let targetDeck: Deck | undefined;
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id === deckId) {
          targetDeck = {
            ...deck,
            flashcards: deck.flashcards.map(card =>
              card.id === cardId ? { ...card, ...updates } : card
            ),
            updatedAt: Date.now(),
          };
          return targetDeck;
        }
        return deck;
      })
    );
    return targetDeck;
  }, []);

  const deleteCardFromDeck = useCallback((deckId: string, cardId: string): Deck | undefined => {
    let targetDeck: Deck | undefined;
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id === deckId) {
           targetDeck = {
            ...deck,
            flashcards: deck.flashcards.filter(card => card.id !== cardId),
            updatedAt: Date.now(),
          };
          return targetDeck;
        }
        return deck;
      })
    );
    return targetDeck;
  }, []);


  return { decks, setDecks, isLoaded, addDeck, getDeckById, updateDeck, deleteDeck, addCardToDeck, updateCardInDeck, deleteCardFromDeck };
}
