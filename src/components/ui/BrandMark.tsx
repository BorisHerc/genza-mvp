import { cn } from '../../lib/utils'

type BrandMarkSize = 'sm' | 'md' | 'lg'

interface BrandMarkProps {
  size?: BrandMarkSize
  className?: string
}

const sizeStyles: Record<BrandMarkSize, string> = {
  sm: 'h-9 w-9 rounded-xl text-sm',
  md: 'h-12 w-12 rounded-2xl text-lg',
  lg: 'h-14 w-14 rounded-2xl text-xl',
}

export function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  return (
    <span
      aria-label="Genza"
      className={cn(
        'flex shrink-0 items-center justify-center bg-brand-600 font-bold text-white shadow-sm',
        sizeStyles[size],
        className,
      )}
    >
      G
    </span>
  )
}
