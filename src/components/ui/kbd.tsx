import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-ink-200 bg-surface px-1 font-mono text-[10px] text-ink-500">
      {children}
    </span>
  );
}
