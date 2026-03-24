import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastDetail {
  label: string;
  value: string;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  /** Structured key-value details shown as a mini table */
  details?: ToastDetail[];
  duration?: number; // ms, default 4000
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) => {
    counter += 1;
    const id = `toast-${counter}-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

type ToastOptions = { message?: string; details?: ToastDetail[]; duration?: number };

// Convenience helpers
export const toast = {
  success: (title: string, messageOrOpts?: string | ToastOptions) => {
    const opts = typeof messageOrOpts === "string" ? { message: messageOrOpts } : (messageOrOpts ?? {});
    useToastStore.getState().addToast({ type: "success", title, ...opts });
  },
  error: (title: string, messageOrOpts?: string | ToastOptions) => {
    const opts = typeof messageOrOpts === "string" ? { message: messageOrOpts } : (messageOrOpts ?? {});
    useToastStore.getState().addToast({ type: "error", title, ...opts });
  },
  warning: (title: string, messageOrOpts?: string | ToastOptions) => {
    const opts = typeof messageOrOpts === "string" ? { message: messageOrOpts } : (messageOrOpts ?? {});
    useToastStore.getState().addToast({ type: "warning", title, ...opts });
  },
  info: (title: string, messageOrOpts?: string | ToastOptions) => {
    const opts = typeof messageOrOpts === "string" ? { message: messageOrOpts } : (messageOrOpts ?? {});
    useToastStore.getState().addToast({ type: "info", title, ...opts });
  },
};
