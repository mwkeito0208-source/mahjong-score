import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label?: string;
  hint?: string;
  error?: string;
};

const fieldClasses =
  "w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--accent)] focus:outline-none";

export const Input = forwardRef<
  HTMLInputElement,
  BaseProps & InputHTMLAttributes<HTMLInputElement>
>(function Input({ label, hint, error, className = "", id, ...rest }, ref) {
  const fid = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          {label}
        </label>
      )}
      <input ref={ref} id={fid} className={`${fieldClasses} ${error ? "border-[var(--negative)]" : ""} ${className}`} {...rest} />
      {error ? (
        <p className="mt-1 text-xs text-[var(--negative)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--ink-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, hint, error, className = "", id, ...rest }, ref) {
  const fid = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
          {label}
        </label>
      )}
      <textarea ref={ref} id={fid} className={`${fieldClasses} ${error ? "border-[var(--negative)]" : ""} ${className}`} {...rest} />
      {error ? (
        <p className="mt-1 text-xs text-[var(--negative)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--ink-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
});
