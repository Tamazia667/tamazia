import * as React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost'; size?: 'sm' | 'default' }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-transparent hover:bg-muted',
    ghost: 'bg-transparent hover:bg-muted',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-9 px-4 text-sm',
  };
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';
