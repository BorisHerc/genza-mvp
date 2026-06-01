import { useMemo, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import {
  getOfferDurationOptions,
  encodeOfferMessage,
} from '../../lib/offer-message'
import { getPriceDelta } from '../../lib/offer-sort'
import { useTranslation } from '../../context/LocaleContext'
import { useCurrency } from '../../context/CurrencyContext'
import { OfferTrustStrip } from './OfferTrustStrip'
import { cn } from '../../lib/utils'

interface CreateOfferFormProps {
  taskBudget: number
  taskCurrency?: import('../../lib/currency').SupportedCurrency
  trustLines?: { verified?: boolean; completedJobs?: number; rating?: number }
  onSubmit: (input: {
    message: string
    price: number
    estimatedDuration?: string
  }) => Promise<string | undefined>
}

export function CreateOfferForm({ taskBudget, taskCurrency, trustLines, onSubmit }: CreateOfferFormProps) {
  const { t } = useTranslation()
  const { formatBudget, getCurrencySymbol } = useCurrency()
  const durationOptions = getOfferDurationOptions()
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState(String(taskBudget))
  const [duration, setDuration] = useState<string>(durationOptions[2].value)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const amount = Number(price)
  const priceDelta = useMemo(
    () => (amount > 0 ? getPriceDelta(amount, taskBudget) : 'match'),
    [amount, taskBudget],
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!message.trim()) {
      setError(t('offers.messageRequired'))
      return
    }
    if (!amount || amount <= 0) {
      setError(t('offers.invalidAmount'))
      return
    }
    if (priceDelta !== 'match' && message.trim().length < 20) {
      setError(t('offers.priceExplainRequired'))
      return
    }

    setIsSubmitting(true)
    const resultError = await onSubmit({
      message: encodeOfferMessage(message.trim(), { estimatedDuration: duration }),
      price: amount,
      estimatedDuration: duration,
    })
    setIsSubmitting(false)

    if (resultError) setError(resultError)
    else {
      setMessage('')
      setPrice(String(taskBudget))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/30 p-5 shadow-card"
    >
      <div>
        <h3 className="text-base font-bold text-gray-900">{t('offers.makeOffer')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('offers.makeOfferHint')}</p>
        {trustLines && (
          <OfferTrustStrip
            verified={trustLines.verified}
            completedJobs={trustLines.completedJobs}
            rating={trustLines.rating}
            className="mt-3"
          />
        )}
      </div>

      <Input
        label={t('offers.yourPrice', { symbol: getCurrencySymbol(taskCurrency) })}
        type="number"
        min="1"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={isSubmitting}
        hint={t('offers.taskBudgetHint', { budget: formatBudget(taskBudget, 'fixed', taskCurrency) })}
      />

      {priceDelta !== 'match' && amount > 0 && (
        <div
          className={cn(
            'rounded-xl border px-3 py-2.5 text-sm',
            priceDelta === 'below'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-900',
          )}
        >
          <p className="font-semibold">
            {priceDelta === 'below' ? t('offers.counterBelowBudget') : t('offers.counterAboveBudget')}
          </p>
          <p className="mt-1 text-xs opacity-90">{t('offers.counterExplainHint')}</p>
        </div>
      )}

      <div>
        <label htmlFor="offer-duration" className="mb-1.5 block text-sm font-semibold text-gray-700">
          {t('offers.estimatedDuration')}
        </label>
        <select
          id="offer-duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        label={priceDelta !== 'match' ? t('offers.pitchWithPrice') : t('offers.pitch')}
        placeholder={
          priceDelta !== 'match'
            ? t('offers.pitchPricePlaceholder')
            : t('offers.pitchPlaceholder')
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isSubmitting}
        rows={4}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" fullWidth size="lg" disabled={isSubmitting} className="min-h-12">
        <Send className="h-4 w-4" />
        {isSubmitting ? t('offers.sendingOffer') : t('offers.sendOffer')}
      </Button>
    </form>
  )
}
