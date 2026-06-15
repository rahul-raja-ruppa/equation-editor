import type { ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 select-none text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
      {children}
    </div>
  );
}
