
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FlashcardType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface EditCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  card: FlashcardType | null;
  onConfirmUpdate: (cardId: string, front: string, back: string) => void;
}

export function EditCardDialog({ isOpen, onOpenChange, card, onConfirmUpdate }: EditCardDialogProps) {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (card) {
      setFrontText(card.front);
      setBackText(card.back);
    }
  }, [card]);

  if (!card) return null;

  const handleConfirm = () => {
    if (!frontText.trim() || !backText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Fields',
        description: 'Both front and back of the card must have content.',
      });
      return;
    }
    onConfirmUpdate(card.id, frontText, backText);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    // Reset state if needed when dialog is closed without saving
    if (card) {
        setFrontText(card.front);
        setBackText(card.back);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>
            Modify the front and back text of your flashcard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-card-front">Front</Label>
            <Textarea
              id="edit-card-front"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="Text for the front of the card"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-card-back">Back</Label>
            <Textarea
              id="edit-card-back"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder="Text for the back of the card"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
