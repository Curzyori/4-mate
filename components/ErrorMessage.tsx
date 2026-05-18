"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div
      id="error-message"
      className="animate-slide-down mx-auto mt-6 w-full max-w-2xl px-6"
    >
      <div className="flex items-start gap-3 rounded-md border border-accent-orange/20 bg-accent-orange/5 p-4">
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-accent-orange"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-accent-orange">
            Informasi Gangguan Layanan
          </p>
          <p className="mt-1 text-sm text-body-mid leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-sm p-1 text-mute transition-colors hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
