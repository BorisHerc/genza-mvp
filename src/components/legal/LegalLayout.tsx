import { ArrowLeft } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../context/LocaleContext'
import { BrandMark } from '../ui/BrandMark'
import { SiteFooter } from './SiteFooter'

export function LegalLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="text-lg font-bold text-gray-900">{t('common.brand')}</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-12">
        <Outlet />
      </main>

      <div className="border-t border-gray-200 bg-white">
        <SiteFooter compact />
      </div>
    </div>
  )
}
