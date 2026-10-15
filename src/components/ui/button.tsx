'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const VariantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong border-transparent',
  secondary: 'bg-surface text-ink hover:bg-surface-sunken border-line-strong',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-sunken border-transparent',
  danger: 'bg-surface text-danger hover:bg-danger-soft border-danger/30',
};

const SizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9.5 px-4 text-[13.5px] gap-2',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md border font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VariantClass[variant],
        SizeClass[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
