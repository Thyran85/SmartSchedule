import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  head?: ReactNode;
  minWidth?: string;
  maxHeight?: string;
}

export default function Table({
  children,
  head,
  minWidth = '760px',
  maxHeight = 'max-h-[65vh]',
  className,
  ...rest
}: TableProps) {
  return (
    <div className="card overflow-hidden">
      <div className={clsx('scrollbar-thin overflow-auto', maxHeight)}>
        <table
          className={clsx('w-full text-sm', className)}
          style={{ minWidth }}
          {...rest}
        >
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
      <tr className="border-b border-line">{children}</tr>
    </thead>
  );
}

/**
 * Sticky header cell: stays pinned to the top of the scroll area.
 */
export function Th({
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        'sticky top-0 z-[5] whitespace-nowrap bg-surface px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted',
        'shadow-[0_1px_0_0_var(--color-line),0_6px_14px_-10px_rgba(33,29,62,0.25)]',
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

export function Tr({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={clsx(
        'transition-colors duration-150 hover:bg-primary-soft/30',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

/**
 * Sticky right column (e.g. action buttons), always visible on small screens
 * while the rest of the table scrolls horizontally.
 */
export function ThActions({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        'sticky right-0 top-0 z-[6] whitespace-nowrap bg-surface px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted',
        'shadow-[0_1px_0_0_var(--color-line),-8px_0_8px_-8px_rgba(33,29,62,0.15),0_6px_14px_-10px_rgba(33,29,62,0.25)]',
        className,
      )}
      {...rest}
    />
  );
}

export function TdActions({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={clsx(
        'sticky right-0 bg-surface px-4 py-3.5 align-middle',
        'shadow-[-8px_0_8px_-8px_rgba(33,29,62,0.15)]',
        className,
      )}
      {...rest}
    />
  );
}