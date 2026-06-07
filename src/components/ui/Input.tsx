import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-monster-muted">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`rounded-xl border border-monster-border bg-monster-dark px-4 py-3 text-sm text-white placeholder:text-monster-muted focus:border-monster-green focus:outline-none focus:ring-1 focus:ring-monster-green ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
