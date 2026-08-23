"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type ManagerDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

export function ManagerDialog({ open, title, description, onClose, children }: ManagerDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 h-full w-full bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl rounded-[1.75rem] border border-slate-800 bg-slate-950/95 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
