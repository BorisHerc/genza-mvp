import { AlertTriangle } from 'lucide-react'
import type { Offer } from '../../types/marketplace'
import { formatOfferDuration, parseOfferMessage } from '../../lib/offer-message'
import { useTranslation } from '../../context/LocaleContext'
import { formatBudget } from '../../lib/utils'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface AcceptOfferDialogProps {
  open: boolean
  offer: Offer | null
  taskTitle: string
  currency?: import('../../lib/currency').SupportedCurrency
  isAccepting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function AcceptOfferDialog({
  open,
  offer,
  taskTitle,
  currency,
  isAccepting,
  onConfirm,
  onCancel,
}: AcceptOfferDialogProps) {
  const { t } = useTranslation()

  if (!open || !offer) return null

  const parsed = parseOfferMessage(offer.message)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">{t('offers.acceptTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('offers.acceptAssigning', { name: offer.taskerName, task: taskTitle })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={offer.taskerName} imageUrl={offer.taskerAvatarUrl} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{offer.taskerName}</p>
              <p className="text-lg font-bold text-brand-700">{formatBudget(offer.price, 'fixed', currency)}</p>
            </div>
          </div>
          {parsed.estimatedDuration && (
            <p className="mt-2 text-xs text-gray-600">
              {t('offers.estimatedDurationLabel', {
                duration: formatOfferDuration(parsed.estimatedDuration) ?? '',
              })}
            </p>
          )}
          <p className="mt-2 line-clamp-3 text-sm text-gray-600">{parsed.message}</p>
        </div>

        <div className="mt-5 flex gap-2">
          <Button fullWidth variant="outline" onClick={onCancel} disabled={isAccepting}>
            {t('common.cancel')}
          </Button>
          <Button fullWidth onClick={onConfirm} disabled={isAccepting}>
            {isAccepting ? t('offers.accepting') : t('offers.acceptConfirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
