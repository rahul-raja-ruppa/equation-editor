import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Kbd } from './kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface IconBtnProps {
  onClick: () => void;
  label: string;
  sub?: string;
  tone?: 'success';
  children: ReactNode;
}

export function IconBtn({ onClick, label, sub, tone, children }: IconBtnProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex h-[26px] w-[26px] items-center justify-center rounded-md transition-colors',
            tone === 'success' ? 'text-success' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {sub && <Kbd>{sub}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}
