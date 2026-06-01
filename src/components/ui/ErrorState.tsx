import type { ReactNode } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import { Button } from './Button'

interface ErrorStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function ErrorState({ message, actionLabel, onAction, children }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-red-600">{message}</p>
      {children}
      {onAction && (
        <Button className="mt-4" variant="secondary" onClick={onAction}>
          {actionLabel ?? t('common.tryAgain')}
        </Button>
      )}
    </div>
  )
}
