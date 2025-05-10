
"use client";

import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { CsvImportButton } from '@/components/csv-import-button';
import type { FlashcardType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ImportDeckDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeckImported: (name: string, flashcards: FlashcardType[]) => void;
}

export function ImportDeckDialog({ isOpen, onOpenChange, onDeckImported }: ImportDeckDialogProps) {
  const [deckName, setDeckName] = useState('');
  const [importedFlashcards, setImportedFlashcards] = useState<FlashcardType[] | null>(null);
  const { toast } = useToast();

  const handleFlashcardsParsed = (flashcards: FlashcardType[]) => {
    if (flashcards.length > 0) {
      setImportedFlashcards(flashcards);
      toast({
        title: "CSV Parsed",
        description: `${flashcards.length} cards ready. Confirm to create deck.`,
      });
    } else {
      setImportedFlashcards(null);
    }
  };

  const handleConfirmImport = () => {
    if (!deckName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Deck Name Required',
        description: 'Please enter a name for your new deck.',
      });
      return;
    }
    if (!importedFlashcards || importedFlashcards.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Flashcards',
        description: 'Please import a CSV file with flashcards.',
      });
      return;
    }
    onDeckImported(deckName.trim(), importedFlashcards);
    resetAndClose();
  };

  const resetAndClose = () => {
    setDeckName('');
    setImportedFlashcards(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetAndClose(); // Reset on close if not confirmed
      else onOpenChange(true);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import New Deck</DialogTitle>
          <DialogDescription>
            Enter a name for your new deck and import flashcards from a CSV file.
            The CSV must have 'front' and 'back' columns.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deck-name" className="text-right">
              Deck Name
            </Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Spanish Vocabulary"
            />
          </div>
          <div className="flex justify-center">
            <CsvImportButton onImport={handleFlashcardsParsed} buttonText="Select CSV File" />
          </div>
          {importedFlashcards && (
            <p className="text-sm text-muted-foreground text-center">
              {importedFlashcards.length} cards parsed from CSV.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirmImport} disabled={!deckName || !importedFlashcards}>
            Create Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
