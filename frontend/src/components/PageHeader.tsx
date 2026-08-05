import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  kicker,
  crumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        'mb-8 flex flex-col gap-4 animate-fade-up sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label="Fil d'ariane"
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted"
          >
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {c.to ? (
                  <Link
                    to={c.to}
                    className="rounded transition-colors hover:text-primary"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-body">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {kicker && <span className="page-kicker">{kicker}</span>}
        <h1 className="text-[26px] font-semibold leading-tight sm:text-[30px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}