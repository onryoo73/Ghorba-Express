"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import type { Toast } from "@/lib/hooks/use-toast";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
};

const colors = {
  success: "bg-emerald/20 border-emerald/50 text-emerald",
  error: "bg-rose-50 dark:bg-rose-400/20 border-rose-200 dark:border-rose-400/50 text-rose-600 dark:text-rose-300",
  info: "bg-electricBlue/20 border-electricBlue/50 text-electricBlue",
  warning: "bg-amber/20 border-amber/50 text-amber"
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps): JSX.Element {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`p-4 rounded-xl border backdrop-blur-sm ${colors[toast.type]}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{toast.title}</p>
                  {toast.message && (
                    <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="p-1 hover:bg-surface rounded-lg transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
