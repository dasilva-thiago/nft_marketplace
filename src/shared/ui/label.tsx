import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-[#c9bdb2] peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-mono',
        className,
      )}
      {...props}
    />
  );
}
