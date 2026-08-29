'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import './ui.css';

export type InputSize = 'sm' | 'md' | 'lg';

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>;

export interface InputProps extends NativeProps {
  as?: 'input' | 'textarea';
  label?: string;
  hint?: string;
  errorMessage?: string;
  size?: InputSize;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(function Input(
  {
    label,
    hint,
    errorMessage,
    size = 'md',
    fullWidth = false,
    loading = false,
    as = 'input',
    id,
    className,
    required,
    rows = 3,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  const hasError = Boolean(errorMessage);
  const hintId = hint ? `${resolvedId}-hint` : undefined;
  const errorId = errorMessage ? `${resolvedId}-error` : undefined;

  const containerClasses = cn(
    'input-container',
    `input-${size}`,
    fullWidth && 'input-full',
    hasError && 'input-error'
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={resolvedId} className="input-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {as === 'textarea' ? (
          <textarea
            ref={ref as Ref<HTMLTextAreaElement>}
            id={resolvedId}
            required={required}
            rows={rows}
            className={cn('input-field', className)}
            aria-describedby={hintId ?? errorId}
            aria-invalid={hasError}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as Ref<HTMLInputElement>}
            id={resolvedId}
            required={required}
            className={cn('input-field', className)}
            aria-describedby={hintId ?? errorId}
            aria-invalid={hasError}
            {...rest}
          />
        )}
        {loading && (
          <div className="input-loading">
            <span className="loading-spinner" aria-hidden="true" />
          </div>
        )}
      </div>
      {hint && !errorMessage && (
        <div id={hintId} className="input-hint">
          {hint}
        </div>
      )}
      {errorMessage && (
        <div id={errorId} className="input-error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
});
