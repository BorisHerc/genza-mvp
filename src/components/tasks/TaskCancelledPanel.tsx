import { RotateCcw, XCircle } from 'lucide-react'
import { useTranslation } from '../../context/LocaleContext'
import { Card } from '../ui/Card'

export function TaskCancelledPanel() {
  const { t } = useTranslation()

  return (
    <Card className="flex items-start gap-3 border-red-200 bg-red-50">
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div>
        <p className="text-sm font-semibold text-red-900">{t('tasks.assignmentCancelledTitle')}</p>
        <p className="mt-1 text-sm text-red-800">{t('tasks.assignmentCancelledHint')}</p>
      </div>
    </Card>
  )
}

export function TaskReopenHint() {
  const { t } = useTranslation()

  return (
    <Card className="flex items-start gap-3 border-gray-200 bg-gray-50">
      <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
      <p className="text-sm text-gray-600">{t('tasks.reopenHint')}</p>
    </Card>
  )
}
