import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'neutral' | 'primary' | 'danger' | 'gold' | 'success';
}

const tones = {
  neutral: 'text-muted hover:bg-black/5 hover:text-ink',
  primary: 'text-muted hover:bg-primary-soft hover:text-primary',
  danger: 'text-muted hover:bg-danger-soft hover:text-danger',
  gold: 'text-muted hover:bg-gold-soft hover:text-gold-strong',
  success: 'text-muted hover:bg-success-soft hover:text-success-strong',
};

export default function IconButton({
  label,
  tone = 'primary',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        'grid h-8 w-8 place-items-center rounded-[9px] transition-colors duration-150 [&>svg]:h-4 [&>svg]:w-4',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}