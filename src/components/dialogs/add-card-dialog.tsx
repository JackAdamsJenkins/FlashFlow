
"use client";

import React, { useState }from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AddCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirmAdd: (front: string, back: string) => void;
}

export function AddCardDialog({ isOpen, onOpenChange, onConfirmAdd }: AddCardDialogProps) {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!frontText.trim() || !backText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Fields',
        description: 'Both front and back of the card must have content.',
      });
      return;
    }
    onConfirmAdd(frontText.trim(), backText.trim());
    resetAndClose();
  };
  
  const resetAndClose = () => {
    setFrontText('');
    setBackText('');
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetAndClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Flashcard</DialogTitle>
          <DialogDescription>
            Enter the front and back text for your new flashcard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-card-front">Front</Label>
            <Textarea
              id="new-card-front"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="Text for the front of the card"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-card-back">Back</Label>
            <Textarea
              id="new-card-back"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder="Text for the back of the card"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            Add Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
