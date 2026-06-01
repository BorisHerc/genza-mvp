import { useTranslation } from '../../context/LocaleContext'
import { BrandMark } from '../ui/BrandMark'

export function AuthLoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <BrandMark size="md" />
        <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
        </div>
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </div>
    </div>
  )
}
