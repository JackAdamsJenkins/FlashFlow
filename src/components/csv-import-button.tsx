"use client";

import type { ChangeEvent } from "react";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud } from "lucide-react";
import type { FlashcardType } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface CsvImportButtonProps {
  onImport: (flashcards: FlashcardType[]) => void;
}

export function CsvImportButton({ onImport }: CsvImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r\n|\n/);
      
      if (lines.length < 2) {
        throw new Error("CSV file must have a header row and at least one data row.");
      }

      const header = lines[0].split(",").map(h => h.trim().toLowerCase());
      const frontIndex = header.indexOf("front");
      const backIndex = header.indexOf("back");

      if (frontIndex === -1 || backIndex === -1) {
        throw new Error("CSV file must contain 'front' and 'back' columns.");
      }

      const importedFlashcards: FlashcardType[] = lines
        .slice(1)
        .filter(line => line.trim() !== "")
        .map((line, index) => {
          const values = line.split(","); // Basic CSV split, consider a library for robustness
          return {
            id: `card-${Date.now()}-${index}`, // Simple unique ID
            front: values[frontIndex]?.trim() || "",
            back: values[backIndex]?.trim() || "",
          };
        });
      
      if (importedFlashcards.length === 0) {
        throw new Error("No valid flashcards found in the CSV file.");
      }

      onImport(importedFlashcards);
      toast({
        title: "Import Successful",
        description: `${importedFlashcards.length} flashcards imported.`,
      });
    } catch (error) {
      console.error("Error importing CSV:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import.";
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: errorMessage,
      });
      onImport([]); // Clear existing cards on error or pass empty
    } finally {
      setIsLoading(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-labelledby="csv-import-button-label"
      />
      <Button
        id="csv-import-button-label"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        {isLoading ? "Importing..." : "Import Flashcards (CSV)"}
      </Button>
    </>
  );
}
