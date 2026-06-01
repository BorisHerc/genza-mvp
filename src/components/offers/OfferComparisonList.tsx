import { useMemo, useState } from 'react'
import type { Offer } from '../../types/marketplace'
import type { OfferSortKey } from '../../lib/offer-sort'
import { sortOffers, getTopRatedOfferId } from '../../lib/offer-sort'
import { useTranslation } from '../../context/LocaleContext'
import { OfferCard } from './OfferCard'
import { cn } from '../../lib/utils'

interface OfferComparisonListProps {
  offers: Offer[]
  taskBudget?: number
  currency?: import('../../lib/currency').SupportedCurrency
  acceptingId: string | null
  onRequestAccept: (offer: Offer) => void
}

const SORT_OPTIONS: OfferSortKey[] = ['price', 'rating', 'fastest', 'closest', 'newest']

export { getTopRatedOfferId }

export function OfferComparisonList({
  offers,
  taskBudget,
  currency,
  acceptingId,
  onRequestAccept,
}: OfferComparisonListProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<OfferSortKey>('price')

  const sortedOffers = useMemo(() => sortOffers(offers, sortKey), [offers, sortKey])
  const topRatedId = useMemo(() => getTopRatedOfferId(offers), [offers])

  return (
    <div className="space-y-4">
      {offers.length > 1 && (
        <>
          <p className="text-sm text-gray-500">
            {t('offers.compareHint', { count: offers.length })}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SORT_OPTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  sortKey === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {t(`offers.sort.${key}`)}
              </button>
            ))}
          </div>
        </>
      )}

      {sortedOffers.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          taskBudget={taskBudget}
          currency={currency}
          canAccept
          isTopRated={offer.id === topRatedId && offers.length > 1}
          isAccepting={acceptingId === offer.id}
          onAccept={() => onRequestAccept(offer)}
        />
      ))}
    </div>
  )
}
