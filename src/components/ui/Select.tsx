import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = '', id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-xs font-medium uppercase tracking-wide text-monster-muted">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`rounded-xl border border-monster-border bg-monster-dark px-4 py-3 text-sm text-white focus:border-monster-green focus:outline-none focus:ring-1 focus:ring-monster-green ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
