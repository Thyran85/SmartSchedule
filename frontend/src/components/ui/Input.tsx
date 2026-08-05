import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import clsx from 'clsx';

const controlBase =
  'w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm text-ink ' +
  'placeholder:text-muted transition-[border-color,box-shadow,background-color] duration-150 ' +
  'focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  required,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-medium text-ink"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(controlBase, 'h-10', className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        controlBase,
        'h-10 cursor-pointer select-chevron appearance-none bg-surface pr-9',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function TextArea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(controlBase, 'min-h-[80px] py-2.5', className)}
      {...rest}
    />
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  description?: string;
}) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-3',
        'transition-colors duration-150 hover:border-primary/40',
        className,
      )}
    >
      <input
        type="checkbox"
        className="checkbox-check mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border-2 border-line-strong bg-surface transition-colors checked:border-primary checked:bg-primary"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        )}
      </span>
    </label>
  );
}