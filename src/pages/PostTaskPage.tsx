import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CategorySelectGrid } from '../components/tasks/CategorySelectGrid'
import { UrgencySelector } from '../components/tasks/UrgencySelector'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StepProgress } from '../components/ui/StepProgress'
import { SuccessMoment } from '../components/ui/SuccessMoment'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { useToast } from '../context/ToastContext'
import { useTranslation } from '../context/LocaleContext'
import { getPopularCategoryLabel } from '../lib/marketplace-psychology'
import { formatSuggestedBudget, getSuggestedBudgets } from '../lib/suggested-budgets'
import { createTask } from '../lib/tasks'
import { getPublicTaskPath } from '../lib/task-slug'
import { getCategoryLabel } from '../lib/utils'
import type { TaskCategory } from '../types'

export function PostTaskPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currency, setCurrency, suggestCurrencyForLocation, getCurrencySymbol } = useCurrency()
  const toast = useToast()
  const steps = useMemo(
    () => [
      t('tasks.postSteps.category'),
      t('tasks.postSteps.details'),
      t('tasks.postSteps.budget'),
      t('tasks.postSteps.review'),
    ],
    [t],
  )
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory | null>(null)
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postedTaskPath, setPostedTaskPath] = useState<string | null>(null)

  useEffect(() => {
    if (user?.location && !location) setLocation(user.location)
  }, [user?.location, location])

  useEffect(() => {
    if (location.trim()) {
      setCurrency(suggestCurrencyForLocation(location))
    }
  }, [location, setCurrency, suggestCurrencyForLocation])

  const suggested = getSuggestedBudgets(category)
  const popularLabel = getPopularCategoryLabel(category)

  const goNext = () => {
    setError('')
    if (step === 1 && !category) return setError(t('tasks.pickCategory'))
    if (step === 2 && (!title.trim() || !description.trim())) {
      return setError(t('tasks.addTitleDescription'))
    }
    if (step === 3) {
      if (!budget || Number(budget) <= 0) return setError(t('tasks.chooseBudget'))
      if (!location.trim()) return setError(t('tasks.addLocation'))
    }
    setStep((current) => Math.min(current + 1, steps.length))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!user || !category) return setError(t('tasks.signInToPost'))

    setIsSubmitting(true)
    const result = await createTask(user.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      budget: Number(budget),
      budgetType: 'fixed',
      currency,
      location: location.trim(),
      urgent,
    })
    setIsSubmitting(false)

    if (result.error || !result.taskId) {
      toast.error(result.error ?? t('tasks.postFailed'))
      setError(result.error ?? t('tasks.postFailed'))
      return
    }

    const path = getPublicTaskPath(result.taskId, title.trim(), location.trim())
    setPostedTaskPath(path)
    toast.success(t('tasks.postSuccess'))
  }

  if (postedTaskPath) {
    return (
      <div className="px-4 pb-24 pt-4">
        <SuccessMoment
          title={t('tasks.postLiveTitle')}
          description={t('tasks.postLiveDescription')}
          primaryLabel={t('tasks.viewYourTask')}
          onPrimary={() => navigate(postedTaskPath)}
          secondaryLabel={t('tasks.postAnother')}
          onSecondary={() => {
            setPostedTaskPath(null)
            setStep(1)
            setTitle('')
            setDescription('')
            setCategory(null)
            setBudget('')
            setUrgent(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="px-4 pb-28 pt-4">
      <button
        type="button"
        onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {step > 1 ? t('common.back') : t('common.cancel')}
      </button>

      <h1 className="text-2xl font-bold text-gray-900">{t('tasks.postTask')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('tasks.postTaskSubtitle')}</p>

      <StepProgress steps={steps} currentStep={step} className="my-6" />

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); goNext() }} className="space-y-5">
        {step === 1 && (
          <section className="space-y-3">
            <p className="text-sm text-gray-600">{t('tasks.postCategoryPrompt')}</p>
            <CategorySelectGrid value={category} onChange={setCategory} />
            {popularLabel && (
              <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
                {popularLabel} {t('common.onGenza')}
              </p>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <Input
              label={t('tasks.postTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('tasks.postTitlePlaceholder')}
              required
            />
            <Textarea
              label={t('tasks.postDescription')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tasks.postDescriptionPlaceholder')}
              rows={5}
              required
            />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t('tasks.suggestedBudget')}</p>
              <div className="flex flex-wrap gap-2">
                {suggested.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBudget(String(amount))}
                    className={[
                      'min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
                      budget === String(amount)
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300',
                    ].join(' ')}
                  >
                    {formatSuggestedBudget(amount, currency)}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label={t('tasks.yourBudget', { symbol: getCurrencySymbol(currency) })}
              type="number"
              min="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
            <Input
              label={t('tasks.location')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('tasks.locationPlaceholder')}
              required
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t('tasks.howSoon')}</p>
              <UrgencySelector value={urgent} onChange={setUrgent} />
            </div>
          </section>
        )}

        {step === 4 && category && (
          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-gray-900">{t('tasks.reviewTask')}</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">{t('tasks.reviewCategory')}</dt>
                <dd className="font-medium text-gray-900">{getCategoryLabel(category)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('tasks.reviewTitle')}</dt>
                <dd className="font-medium text-gray-900">{title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('tasks.reviewBudget')}</dt>
                <dd className="font-medium text-brand-700">{formatSuggestedBudget(Number(budget), currency)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('tasks.reviewLocation')}</dt>
                <dd className="font-medium text-gray-900">{location}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('tasks.reviewTiming')}</dt>
                <dd className="font-medium text-gray-900">{urgent ? t('tasks.urgency.urgent') : t('tasks.urgency.standard')}</dd>
              </div>
            </dl>
          </section>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting} className="min-h-12">
          {step === 4 ? (
            isSubmitting ? t('tasks.posting') : t('tasks.postAction')
          ) : (
            <>
              {t('common.continue')}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
