'use client';

import { cn } from '@/utils/cn';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  /** `lg` for lists where the switch is the main control, like a role's permissions. */
  size?: 'md' | 'lg';
};

/** Switch for settings that take effect immediately rather than on save. */
export function Toggle({ checked, onChange, label, disabled = false, size = 'md' }: ToggleProps): React.JSX.Element {
  const large = size === 'lg';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 rounded-full transition-colors',
        large ? 'h-7 w-12' : 'h-5 w-9',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        checked ? 'bg-brand' : 'bg-line-strong',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'absolute rounded-full bg-white shadow-sm transition-[left]',
          large ? 'top-[3px] size-[22px]' : 'top-0.5 size-4',
          large ? (checked ? 'left-[23px]' : 'left-[3px]') : checked ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
