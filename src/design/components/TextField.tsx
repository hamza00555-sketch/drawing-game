import { forwardRef, type InputHTMLAttributes } from 'react';

/**
 * Text input.
 *
 * Two mobile-Arabic details that are easy to miss and painful to hit:
 *   - Font size is forced to at least 16px in index.css, because iOS zooms the
 *     whole viewport when a smaller field takes focus — mid-game that is fatal.
 *   - `dir` is settable per field. Room codes are Latin/numeric and must render
 *     LTR even inside an RTL page, or the characters read back in the wrong
 *     order when a player says them aloud.
 */

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Shown under the field. Use for errors and constraints, kept short. */
  hint?: string;
  invalid?: boolean;
  /** Renders large and letter-spaced, for room codes. */
  code?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, invalid = false, code = false, className = '', id, ...rest },
  ref,
) {
  const fieldId = id ?? `field-${label}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="font-body text-sm text-ink-soft">
        {label}
      </label>

      <input
        {...rest}
        id={fieldId}
        ref={ref}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        className={[
          'min-h-tap w-full rounded-md border-bold bg-paper-raised px-4 py-2',
          'font-body text-ink placeholder:text-ink-faint',
          'transition-colors duration-fast',
          invalid ? 'border-tomato' : 'border-ink',
          code ? 'text-center font-display text-2xl tracking-[0.35em]' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {hint && (
        <p
          id={hintId}
          className={`font-body text-xs ${invalid ? 'text-tomato-deep' : 'text-ink-faint'}`}
        >
          {hint}
        </p>
      )}
    </div>
  );
});
