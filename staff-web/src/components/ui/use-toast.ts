"use client";

import * as React from "react";

type ToastVariant = "default" | "destructive";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
}

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; toastId: string };

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, 1) };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
  }
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function toast({ title, description, variant }: { title?: string; description?: string; variant?: ToastVariant }) {
  const id = genId();
  dispatch({ type: "ADD_TOAST", toast: { id, title, description, variant } });
  const timeout = setTimeout(() => {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
    toastTimeouts.delete(id);
  }, 5000);
  toastTimeouts.set(id, timeout);
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);
  return { toast, toasts: state.toasts, dismiss: (toastId: string) => dispatch({ type: "DISMISS_TOAST", toastId }) };
}

export { toast };
