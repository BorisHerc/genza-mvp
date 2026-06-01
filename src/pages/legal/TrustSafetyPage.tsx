import { PageMeta } from '../../components/profile/PageMeta'
import { TrustSafetyPanel } from '../../components/legal/TrustSafetyPanel'
import { useTranslation } from '../../context/LocaleContext'

export function TrustSafetyPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageMeta
        title={t('legal.trustMetaTitle')}
        description={t('legal.trustMetaDescription')}
      />
      <header className="mb-8 border-b border-gray-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Genza · {t('legal.trustSafety')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t('legal.trustPageTitle')}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
          {t('legal.trustPageSubtitle')}
        </p>
      </header>

      <TrustSafetyPanel />
    </>
  )
}
