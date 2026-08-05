import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  padding = 'md',
  hover = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx('card', paddings[padding], hover && 'card-hover', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  padding = 'md',
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  padding?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={clsx(
        '-mx-5 -mt-5 mb-5 flex items-center justify-between gap-3 border-b border-line px-5 pb-4',
        padding === 'lg' && '-mx-7 -mt-7 px-7',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft text-primary [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}