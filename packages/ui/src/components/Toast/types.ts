import type { Ref } from 'react';

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 'long' keeps it up ~10s; toasts with an action stay until acted on or dismissed. */
  duration?: 'short' | 'long';
}

export interface ToastHostHandle {
  show: (options: ToastOptions) => void;
}

export interface ToastHostProps {
  ref?: Ref<ToastHostHandle>;
  bottomOffset: number;
}
