"use client";
import React from 'react';

interface TimerDisplayProps {
  seconds: number;
  label: string;
  className?: string;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function TimerDisplay({ seconds, label, className }: TimerDisplayProps) {
  return (
    <div className={className}>
      <span className="text-sm text-muted-foreground">{label}: </span>
      <span className="font-semibold">{formatTime(seconds)}</span>
    </div>
  );
}
