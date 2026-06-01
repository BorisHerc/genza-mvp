import { Mail, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LocaleContext'
import { getAllLegalDocuments, getLegalPath, TRUST_SAFETY_PATH } from '../../content/legal'

interface TrustSafetyPanelProps {
  variant?: 'full' | 'compact'
}

export function TrustSafetyPanel({ variant = 'full' }: TrustSafetyPanelProps) {
  const { t } = useTranslation()
  const documents = getAllLegalDocuments()

  if (variant === 'compact') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('legal.trustSafety')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('legal.trustSafetyTeaser')}</p>
            <Link
              to={TRUST_SAFETY_PATH}
              className="mt-2 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {t('legal.learnMore')} →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('legal.trustSafety')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-900/80">
              {t('legal.trustSafetyIntro')}
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-brand-900/90">
          <li>• {t('legal.trustPoint1')}</li>
          <li>• {t('legal.trustPoint2')}</li>
          <li>• {t('legal.trustPoint3')}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-bold text-gray-900">{t('legal.documentsTitle')}</h3>
        <ul className="mt-4 divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc.slug}>
              <Link
                to={getLegalPath(doc.slug)}
                className="flex flex-col gap-0.5 py-3 transition-colors hover:text-brand-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-gray-900">{doc.title}</span>
                <span className="text-sm text-gray-500">{doc.subtitle.slice(0, 60)}…</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-amber-950">{t('legal.reportAbuseTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
              {t('legal.reportAbuseDesc')}
            </p>
            <a
              href={`mailto:${t('legal.reportEmail')}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-50"
            >
              <Mail className="h-4 w-4" />
              {t('legal.reportEmail')}
            </a>
            <p className="mt-3 text-xs text-amber-800/80">{t('legal.reportAbuseNote')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
