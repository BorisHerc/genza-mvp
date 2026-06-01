import { BadgeCheck, Shield, Star } from 'lucide-react'
import type { OfferTrustLineIcon } from '../../lib/marketplace-psychology'
import { getOfferTrustLines } from '../../lib/marketplace-psychology'

interface OfferTrustStripProps {
  verified?: boolean
  completedJobs?: number
  rating?: number
  className?: string
}

function TrustLineIcon({ icon }: { icon?: OfferTrustLineIcon }) {
  if (icon === 'verified') return <BadgeCheck className="h-3.5 w-3.5" />
  if (icon === 'star') return <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
  if (icon === 'shield') return <Shield className="h-3.5 w-3.5" />
  return null
}

export function OfferTrustStrip({ verified, completedJobs, rating, className = '' }: OfferTrustStripProps) {
  const lines = getOfferTrustLines({ verified, completedJobs, rating })

  if (!lines.length) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {lines.map((line) => (
        <span
          key={line.text}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800"
        >
          <TrustLineIcon icon={line.icon} />
          {line.text}
        </span>
      ))}
    </div>
  )
}
