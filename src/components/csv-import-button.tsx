
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
  buttonText?: string;
  disabled?: boolean;
}

export function CsvImportButton({ onImport, buttonText = "Import Flashcards (CSV)", disabled = false }: CsvImportButtonProps) {
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
          const parseCsvRow = (rowString: string): string[] => {
            const result: string[] = [];
            let currentField = '';
            let inQuotes = false;
            for (let i = 0; i < rowString.length; i++) {
              const char = rowString[i];
              if (char === '"') {
                if (inQuotes && i + 1 < rowString.length && rowString[i+1] === '"') {
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
            result.push(currentField);
            return result;
          };
          
          const parsedValues = parseCsvRow(line);

          let frontValue = parsedValues[frontIndex]?.trim() || "";
          let backValue = parsedValues[backIndex]?.trim() || "";

          frontValue = frontValue.replace(/"/g, "");
          backValue = backValue.replace(/"/g, "");

          return {
            id: `card-${Date.now()}-${index}`, 
            front: frontValue,
            back: backValue,
          };
        });
      
      if (importedFlashcards.length === 0) {
        throw new Error("No valid flashcards found in the CSV file.");
      }

      onImport(importedFlashcards); // Simplified callback
      // Toast messages can be handled by the calling component if more context is needed
    } catch (error) {
      console.error("Error importing CSV:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import.";
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: errorMessage,
      });
      // onImport([]); // Caller decides how to handle error, e.g. not creating a deck
    } finally {
      setIsLoading(false);
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
        {isLoading ? "Importing..." : buttonText}
      </Button>
    </>
  );
}
