interface LoadingSpinnerProps {
  label?: string
  fullPage?: boolean
}

export function LoadingSpinner({ label = 'Loading...', fullPage }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'min-h-[50vh]' : 'py-8'}`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-monster-border border-t-monster-green" />
      <p className="text-sm text-monster-muted">{label}</p>
    </div>
  )
}
