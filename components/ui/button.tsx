import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/40 hover:bg-indigo-400',
  secondary: 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-700/70',
  ghost: 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200',
  danger: 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />;
}
