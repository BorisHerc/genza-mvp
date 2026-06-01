import { Navigate, useLocation, useParams } from 'react-router-dom'
import { LegalDocumentView } from '../../components/legal/LegalDocumentView'
import { TrustSafetyPanel } from '../../components/legal/TrustSafetyPanel'
import { PageMeta } from '../../components/profile/PageMeta'
import { useTranslation } from '../../context/LocaleContext'
import { getLegalDocument, resolveLegalSlugFromPath, LEGAL_SLUGS, type LegalSlug } from '../../content/legal'

export function LegalDocumentPage() {
  const { slug: paramSlug } = useParams<{ slug?: string }>()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const slug: LegalSlug | undefined =
    paramSlug && LEGAL_SLUGS.includes(paramSlug as LegalSlug)
      ? (paramSlug as LegalSlug)
      : resolveLegalSlugFromPath(pathname)

  const document = slug ? getLegalDocument(slug) : undefined

  if (!document) {
    return <Navigate to="/trust" replace />
  }

  return (
    <>
      <PageMeta
        title={`${document.title} | Genza`}
        description={document.subtitle}
      />
      <LegalDocumentView
        title={document.title}
        subtitle={document.subtitle}
        lastUpdated={document.lastUpdated}
        lastUpdatedLabel={t('legal.lastUpdated')}
        sections={document.sections}
      />
      <div className="mt-12 border-t border-gray-200 pt-10">
        <TrustSafetyPanel variant="compact" />
      </div>
    </>
  )
}
