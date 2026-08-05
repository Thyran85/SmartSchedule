import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'outline'
  | 'gold';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-strong active:bg-primary-strong shadow-card',
  secondary:
    'bg-primary-soft text-primary hover:bg-[#e2e6ff] active:bg-[#d6dbff]',
  danger:
    'bg-danger text-white hover:bg-danger-strong active:bg-danger-strong shadow-card',
  success:
    'bg-success text-white hover:bg-success-strong active:bg-success-strong shadow-card',
  ghost: 'bg-transparent text-body hover:bg-black/5 active:bg-black/10',
  outline:
    'border border-line-strong bg-surface text-ink hover:border-primary/40 hover:text-primary active:bg-primary-soft/40',
  gold: 'bg-gold text-white hover:bg-gold-strong active:bg-gold-strong shadow-card',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'relative inline-flex select-none items-center justify-center rounded-[10px] font-medium',
        'transition-[background-color,box-shadow,transform,opacity] duration-200',
        'active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : icon ? (
        <span className="shrink-0 [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}