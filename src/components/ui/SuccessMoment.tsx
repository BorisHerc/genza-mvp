import { CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface SuccessMomentProps {
  title: string
  description: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export function SuccessMoment({
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SuccessMomentProps) {
  return (
    <Card className="overflow-hidden border-brand-200 p-0 text-center">
      <div className="bg-gradient-to-br from-brand-50 via-white to-brand-100/50 px-6 py-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
          <Sparkles className="h-3.5 w-3.5" />
          Success
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button fullWidth onClick={onPrimary}>
            {primaryLabel}
          </Button>
          {secondaryLabel && onSecondary && (
            <Button fullWidth variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
