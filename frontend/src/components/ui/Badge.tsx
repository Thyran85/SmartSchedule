import { ReactNode } from 'react';
import clsx from 'clsx';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'gold'
  | 'success'
  | 'danger'
  | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-body/8 text-body',
  primary: 'bg-primary-soft text-primary',
  gold: 'bg-gold-soft text-gold-strong',
  success: 'bg-success-soft text-success-strong',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  tone = 'neutral',
  icon,
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span className={clsx('chip', tones[tone], className)}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      )}
      {icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      {children}
    </span>
  );
}