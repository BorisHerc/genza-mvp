import { Check } from 'lucide-react'
import type { TaskStatus } from '../../types'
import { useTranslation } from '../../context/LocaleContext'
import { getTaskTimelineSteps } from '../../lib/task-status'
import { cn } from '../../lib/utils'

interface TaskLifecycleTimelineProps {
  status: TaskStatus | string
}

export function TaskLifecycleTimeline({ status }: TaskLifecycleTimelineProps) {
  const { t } = useTranslation()
  const steps = getTaskTimelineSteps(status)

  return (
    <section aria-label={t('tasks.progressAria')} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">{t('tasks.progress')}</h2>
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const dotClass =
            step.state === 'complete'
              ? 'border-brand-600 bg-brand-600 text-white'
              : step.state === 'current'
                ? 'border-brand-600 bg-white text-brand-600 ring-4 ring-brand-100'
                : step.state === 'cancelled'
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-gray-200 bg-white text-gray-300'

          const labelClass =
            step.state === 'complete'
              ? 'text-gray-900'
              : step.state === 'current'
                ? 'font-semibold text-brand-700'
                : step.state === 'cancelled'
                  ? 'font-semibold text-red-600'
                  : 'text-gray-400'

          return (
            <li key={`${step.key}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <span
                  className={cn(
                    'absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5',
                    step.state === 'complete' ? 'bg-brand-300' : 'bg-gray-200',
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                  dotClass,
                )}
              >
                {step.state === 'complete' ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn('text-sm', labelClass)}>{step.label}</p>
                {step.state === 'current' && (
                  <p className="text-xs text-brand-600">{t('tasks.currentStep')}</p>
                )}
                {step.state === 'cancelled' && (
                  <p className="text-xs text-red-500">{t('tasks.assignmentEnded')}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
