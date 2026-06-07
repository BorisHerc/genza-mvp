import { Bell, BellOff, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LocaleContext'
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatusForUser,
  type PushSupportStatus,
} from '../../lib/push'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { cn } from '../../lib/utils'

interface PushNotificationsPanelProps {
  className?: string
  compact?: boolean
}

export function PushNotificationsPanel({ className, compact = false }: PushNotificationsPanelProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [status, setStatus] = useState<PushSupportStatus>('unsupported')
  const [isLoading, setIsLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState('')

  const refreshStatus = useCallback(async () => {
    setIsLoading(true)
    const result = await getPushStatusForUser(user?.id)
    setStatus(result.status)
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const handleEnable = async () => {
    if (!user?.id) return
    setActionError('')
    setIsWorking(true)

    const result = await enablePushNotifications(user.id)
    setIsWorking(false)

    if (!result.success) {
      setActionError(result.error ?? t('push.enableFailed'))
      await refreshStatus()
      return
    }

    await refreshStatus()
  }

  const handleDisable = async () => {
    if (!user?.id) return
    setActionError('')
    setIsWorking(true)

    await disablePushNotifications(user.id)
    setIsWorking(false)
    await refreshStatus()
  }

  const title = compact ? t('push.titleShort') : t('push.title')
  const showEnableButton = status === 'ready'
  const showDisableButton = status === 'subscribed'

  return (
    <Card className={cn('border-brand-100 bg-brand-50/30', className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          {status === 'subscribed' ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">
            {isLoading ? t('push.checking') : t(`push.status.${status}`)}
          </p>

          {status === 'ios_install_required' && (
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-gray-600">
              <li>{t('push.iosStep1')}</li>
              <li>{t('push.iosStep2')}</li>
              <li>{t('push.iosStep3')}</li>
            </ol>
          )}

          {status === 'unsupported' && (
            <p className="mt-2 text-xs text-gray-500">{t('push.fallbackInApp')}</p>
          )}

          {status === 'permission_denied' && (
            <p className="mt-2 text-xs text-gray-500">{t('push.permissionDeniedHint')}</p>
          )}

          {actionError && <p className="mt-2 text-xs text-red-600">{actionError}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {showEnableButton && (
              <Button type="button" size="sm" disabled={isWorking || !user?.id} onClick={() => void handleEnable()}>
                <Smartphone className="h-4 w-4" />
                {isWorking ? t('push.enabling') : t('push.enable')}
              </Button>
            )}
            {showDisableButton && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isWorking || !user?.id}
                onClick={() => void handleDisable()}
              >
                {isWorking ? t('push.disabling') : t('push.disable')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
