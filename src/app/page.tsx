
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useDecks } from '@/hooks/use-decks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, Trash2, BookOpen, Edit3 } from 'lucide-react';
import { ImportDeckDialog } from '@/components/dialogs/import-deck-dialog';
import { DeleteDeckDialog } from '@/components/dialogs/delete-deck-dialog';
import type { Deck, FlashcardType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DeckManagementPage() {
  const { decks, addDeck, deleteDeck, isLoaded } = useDecks();
  const [isImportDeckDialogOpen, setIsImportDeckDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const { toast } = useToast();

  const handleDeckImported = (name: string, flashcards: FlashcardType[]) => {
    addDeck(name, flashcards);
    toast({
      title: 'Deck Imported',
      description: `Deck "${name}" with ${flashcards.length} cards has been created.`,
    });
    setIsImportDeckDialogOpen(false);
  };

  const openDeleteDialog = (deck: Deck) => {
    setDeckToDelete(deck);
  };

  const handleConfirmDelete = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    deleteDeck(deckId);
    if (deck) {
      toast({
        title: 'Deck Deleted',
        description: `Deck "${deck.name}" has been deleted.`,
      });
    }
    setDeckToDelete(null);
  };

  if (!isLoaded) {
    // Optional: Add a loading skeleton or spinner here
    return (
      <main className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-background text-foreground">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center">
            <BookOpen size={48} className="mr-3 text-accent" />
            FlashFlow Decks
          </h1>
          <p className="text-muted-foreground mt-2">Loading your flashcard decks...</p>
        </header>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center">
          <BookOpen size={48} className="mr-3 text-accent" />
          FlashFlow Decks
        </h1>
        <p className="text-muted-foreground mt-2">Manage your flashcard decks or import new ones.</p>
      </header>

      <section className="mb-8">
        <Button onClick={() => setIsImportDeckDialogOpen(true)} size="lg">
          <FilePlus className="mr-2 h-5 w-5" /> Import New Deck
        </Button>
      </section>

      {decks.length === 0 ? (
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="p-8">
            <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Decks Yet</h2>
            <p className="text-muted-foreground">
              Click "Import New Deck" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {decks.sort((a,b) => b.updatedAt - a.updatedAt).map((deck) => (
            <Card key={deck.id} className="shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{deck.name}</CardTitle>
                <CardDescription>
                  {deck.flashcards.length} card{deck.flashcards.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Last updated: {format(new Date(deck.updatedAt), "MMM d, yyyy HH:mm")}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center gap-2">
                <Link href={`/study/${deck.id}`} passHref legacyBehavior>
                  <Button variant="default" asChild>
                    <a><BookOpen className="mr-2 h-4 w-4" /> Study</a>
                  </Button>
                </Link>
                {/* Future: Rename button */}
                {/* <Button variant="outline" size="icon" aria-label="Rename deck">
                  <Edit3 className="h-4 w-4" />
                </Button> */}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => openDeleteDialog(deck)}
                  aria-label="Delete deck"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ImportDeckDialog
        isOpen={isImportDeckDialogOpen}
        onOpenChange={setIsImportDeckDialogOpen}
        onDeckImported={handleDeckImported}
      />
      {deckToDelete && (
        <DeleteDeckDialog
          isOpen={!!deckToDelete}
          onOpenChange={() => setDeckToDelete(null)}
          deck={deckToDelete}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
       <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FlashFlow. Manage your decks.</p>
      </footer>
    </main>
  );
}
