import { useEffect, useRef, useState } from 'react';
import { ToastDetail, ToastVariant, subscribeToast } from '../../core/toast';
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle } from 'react-icons/io5';

const variantIcon: Record<ToastVariant, typeof IoCheckmarkCircle> = {
  success: IoCheckmarkCircle,
  error: IoCloseCircle,
  info: IoInformationCircle,
};

const variantIconColor: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-sky-400',
};

type ToastItem = ToastDetail & { leaving: boolean };

interface ToastTimers {
  hide: ReturnType<typeof setTimeout>;
  remove?: ReturnType<typeof setTimeout>;
}

const EXIT_DURATION_MS = 360;

const ToastHost = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ToastTimers>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    const unsubscribe = subscribeToast((toast) => {
      setToasts((prev) => [...prev, { ...toast, leaving: false }]);
      const hideTimer = setTimeout(() => {
        setToasts((prev) => prev.map((item) => (item.id === toast.id ? { ...item, leaving: true } : item)));
        const removeTimer = setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== toast.id));
          const current = timers.get(toast.id);
          if (current?.remove) clearTimeout(current.remove);
          timers.delete(toast.id);
        }, EXIT_DURATION_MS);
        const current = timers.get(toast.id);
        if (current) current.remove = removeTimer;
      }, toast.duration);
      timers.set(toast.id, { hide: hideTimer });
    });

    return () => {
      unsubscribe();
      timers.forEach(({ hide, remove }) => {
        clearTimeout(hide);
        if (remove) clearTimeout(remove);
      });
      timers.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[130] pointer-events-none flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        {toasts.map((toast) => {
          const Icon = variantIcon[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto bg-black/80 backdrop-blur-xl text-white shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-3 ${toast.leaving ? 'toast-leave' : 'toast-enter'}`}
            >
              <Icon className={`w-10 h-10 ${variantIconColor[toast.variant]}`} />
              <span className="text-base font-bold tracking-wide text-center leading-snug">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToastHost;
