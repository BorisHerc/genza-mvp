import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-12 w-full rounded-xl border bg-white text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400',
              leftIcon ? 'pl-10' : 'pl-4',
              rightElement ? 'pr-12' : 'pr-4',
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
              className,
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
