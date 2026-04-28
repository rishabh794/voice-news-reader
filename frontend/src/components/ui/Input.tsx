import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, hint, containerClassName = '', className = '', id, ...props }, ref) => {
        const fallbackId = useId();
        const inputId = id ?? fallbackId;
        const hintId = hint ? `${inputId}-hint` : undefined;

        return (
            <div className={['space-y-2', containerClassName].filter(Boolean).join(' ')}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-xs font-mono uppercase tracking-wider text-subtle"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    aria-describedby={hintId}
                    className={[
                        'w-full rounded-lg border border-border/70 bg-surface px-3 py-2 text-[15px] text-text placeholder:text-subtle',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50',
                        'transition-colors duration-150',
                        className
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    {...props}
                />
                {hint && (
                    <p id={hintId} className="text-xs text-subtle">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
