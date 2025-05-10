
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
import type { FlashcardType } from '@/types';

interface DeleteCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  card: FlashcardType | null;
  onConfirmDelete: () => void; // Callback for actual deletion logic
}

export function DeleteCardDialog({ isOpen, onOpenChange, card, onConfirmDelete }: DeleteCardDialogProps) {
  if (!card) return null;

  const handleConfirm = () => {
    onConfirmDelete();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete This Card?</AlertDialogTitle>
          <AlertDialogDescription>
            Front: "{card.front.substring(0, 50)}{card.front.length > 50 ? '...' : ''}"
            <br />
            This action cannot be undone and will permanently delete this flashcard from the current deck.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Delete Card
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
