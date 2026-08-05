import { ReactNode } from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-10' : 'px-6 py-16',
        className,
      )}
    >
      {icon && (
        <div
          className={clsx(
            'mb-4 grid place-items-center rounded-[14px] bg-primary-soft text-primary',
            compact ? 'h-11 w-11' : 'h-14 w-14',
          )}
        >
          <span className={compact ? '[&>svg]:h-5 [&>svg]:w-5' : '[&>svg]:h-7 [&>svg]:w-7'}>
            {icon}
          </span>
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className={clsx('mt-1.5 max-w-sm text-sm text-muted', compact && 'max-w-xs')}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}