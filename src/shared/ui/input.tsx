import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-sm border border-[#4a2e1e] bg-[#1a110e] px-3 py-2 text-sm text-ink placeholder:text-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'font-mono',
        className,
      )}
      {...props}
    />
  );
}
