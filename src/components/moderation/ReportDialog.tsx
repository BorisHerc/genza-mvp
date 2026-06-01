import { useState } from 'react'
import { Flag } from 'lucide-react'
import { getReportReasons } from '../../lib/i18n'
import { useTranslation } from '../../context/LocaleContext'
import { submitReport } from '../../lib/reports'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

export interface ReportTarget {
  reportedUserId?: string
  taskId?: string
  chatId?: string
  messageId?: string
  label: string
}

interface ReportDialogProps {
  open: boolean
  target: ReportTarget
  reporterId: string
  onClose: () => void
  onSubmitted?: () => void
}

export function ReportDialog({ open, target, reporterId, onClose, onSubmitted }: ReportDialogProps) {
  const { t } = useTranslation()
  const reportReasons = getReportReasons()
  const toast = useToast()
  const [reason, setReason] = useState<string>(reportReasons[0].value)
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    const result = await submitReport({
      reporterId,
      reportedUserId: target.reportedUserId,
      taskId: target.taskId,
      chatId: target.chatId,
      messageId: target.messageId,
      reason,
      details,
    })

    setIsSubmitting(false)

    if (!result.success) {
      toast.error(result.error ?? t('moderation.submitFailed'))
      setError(result.error ?? t('moderation.submitFailed'))
      return
    }

    toast.success(t('moderation.submitSuccess'))

    setSubmitted(true)
    onSubmitted?.()
  }

  const handleClose = () => {
    setReason(reportReasons[0].value)
    setDetails('')
    setError('')
    setSubmitted(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Flag className="h-5 w-5" />
          </span>
          <div>
            <h2 id="report-dialog-title" className="text-base font-bold text-gray-900">
              {t('moderation.reportTitle', { label: target.label })}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('moderation.reportSubtitle')}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              {t('moderation.thanksSubmitted')}
            </p>
            <Button fullWidth onClick={handleClose}>
              {t('common.done')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="mb-1.5 block text-sm font-semibold text-gray-700">
                {t('moderation.reason')}
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {reportReasons.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              label={t('moderation.detailsOptional')}
              name="details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={t('moderation.detailsPlaceholder')}
              rows={4}
            />

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button fullWidth variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button fullWidth onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? t('moderation.submitting') : t('moderation.submitReport')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
