import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  head?: ReactNode;
}

export default function Table({ children, head, className, ...rest }: TableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className={clsx('w-full text-sm', className)} {...rest}>
          {head}
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={className}>
      <tr className="border-b border-line bg-paper/70">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted',
        className,
      )}
      {...rest}
    />
  );
}

export function Td({
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={clsx('px-4 py-3.5 align-middle text-body', className)}
      {...rest}
    />
  );
}

export function Tr({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <tr
      className={clsx(
        'transition-colors duration-150 hover:bg-primary-soft/30',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity duration-150 group-hover:opacity-100">
      {children}
    </div>
  );
}