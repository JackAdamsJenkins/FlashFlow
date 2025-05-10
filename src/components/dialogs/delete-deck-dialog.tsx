
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Deck } from '@/types';

interface DeleteDeckDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  deck: Deck | null;
  onConfirmDelete: (deckId: string) => void;
}

export function DeleteDeckDialog({ isOpen, onOpenChange, deck, onConfirmDelete }: DeleteDeckDialogProps) {
  if (!deck) return null;

  const handleConfirm = () => {
    onConfirmDelete(deck.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Deck: "{deck.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the deck
            and all its flashcards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
