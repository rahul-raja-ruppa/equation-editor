import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    let timer = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="ee-anim-fade fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-800 px-3 py-1.5 text-[11px] text-white shadow-pop">
      {message}
    </div>
  );
}
