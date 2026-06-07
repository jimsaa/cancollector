import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-monster-green text-black hover:bg-monster-green-glow shadow-[0_0_20px_rgba(141,198,63,0.3)]',
  secondary: 'bg-monster-card border border-monster-border text-white hover:border-monster-green',
  ghost: 'bg-transparent text-monster-muted hover:text-white hover:bg-monster-card',
  danger: 'bg-red-900/40 border border-red-700 text-red-300 hover:bg-red-900/60',
}

export function Button({
  variant = 'primary',
  loading,
  fullWidth,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
