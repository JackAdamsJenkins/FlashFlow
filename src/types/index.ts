export interface FlashcardType {
  id: string;
  front: string;
  back: string;
}

export interface Deck {
  id: string;
  name: string;
  flashcards: FlashcardType[];
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}
