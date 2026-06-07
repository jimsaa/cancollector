import logoUrl from '../../assets/logo.png'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 80,
}

interface LogoProps {
  size?: LogoSize | number
  className?: string
  alt?: string
}

export function Logo({ size = 'sm', className = '', alt = 'Can Collector' }: LogoProps) {
  const px = typeof size === 'number' ? size : sizeMap[size]

  return (
    <img
      src={logoUrl}
      alt={alt}
      width={px}
      height={px}
      className={`shrink-0 rounded-xl object-cover ${className}`}
      decoding="async"
    />
  )
}
