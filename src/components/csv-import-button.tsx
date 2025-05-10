
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
  disabled?: boolean;
}

export function CsvImportButton({ onImport, disabled = false }: CsvImportButtonProps) {
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
          
          // Handle cases where values might be wrapped in quotes or contain commas within quotes
          // This is a simplified parser. For complex CSV, a proper library is better.
          const parseCsvRow = (rowString: string): string[] => {
            const result: string[] = [];
            let currentField = '';
            let inQuotes = false;
            for (let i = 0; i < rowString.length; i++) {
              const char = rowString[i];
              if (char === '"') {
                if (inQuotes && i + 1 < rowString.length && rowString[i+1] === '"') {
                  // Escaped quote
                  currentField += '"';
                  i++; 
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                result.push(currentField);
                currentField = '';
              } else {
                currentField += char;
              }
            }
            result.push(currentField); // Add the last field
            return result;
          };
          
          const parsedValues = parseCsvRow(line);

          let frontValue = parsedValues[frontIndex]?.trim() || "";
          let backValue = parsedValues[backIndex]?.trim() || "";

          // Remove all double quotes from front and back values if they are not part of escaped quotes
          // The regex /^\s*"|"\s*$/g targets leading/trailing quotes possibly with spaces.
          // For internal quotes, if any remain after parsing they might be intentional.
          // However, the request was to remove *all* double quotes from the final values.
          frontValue = frontValue.replace(/"/g, "");
          backValue = backValue.replace(/"/g, "");


          return {
            id: `card-${Date.now()}-${index}`, // Simple unique ID
            front: frontValue,
            back: backValue,
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
        disabled={isLoading || disabled}
      />
      <Button
        id="csv-import-button-label"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        {isLoading ? "Importing..." : "Import Flashcards (CSV)"}
      </Button>
    </>
  );
}
