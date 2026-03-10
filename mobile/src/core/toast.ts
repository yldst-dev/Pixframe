export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastDetail {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastInput {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

const TOAST_EVENT_NAME = 'pixframe:toast';

function createToastId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function showToast(input: string | ToastInput): void {
  if (typeof window === 'undefined') return;

  const payload = typeof input === 'string' ? { message: input } : input;
  const detail: ToastDetail = {
    id: createToastId(),
    message: payload.message,
    variant: payload.variant ?? 'success',
    duration: payload.duration ?? 2200,
  };

  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT_NAME, { detail }));
}

export function subscribeToast(listener: (detail: ToastDetail) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ToastDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(TOAST_EVENT_NAME, handler as EventListener);
  return () => {
    window.removeEventListener(TOAST_EVENT_NAME, handler as EventListener);
  };
}
