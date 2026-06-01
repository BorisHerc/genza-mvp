import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PageLoaderProps {
  label?: string
  className?: string
}

export function PageLoader({ label, className }: PageLoaderProps) {
  return (
    <div className={cn('flex min-h-[50dvh] flex-col items-center justify-center gap-3', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  )
}
