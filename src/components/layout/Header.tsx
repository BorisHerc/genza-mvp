import { Bell, ChevronDown, MapPin, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { useTranslation } from '../../context/LocaleContext'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface HeaderProps {
  location?: string
}

export function Header({ location = 'Mostar, BiH' }: HeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { unreadCount } = useNotifications()
  const displayLocation = isAuthenticated ? user?.location ?? location : location

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-lg px-4 pb-3 pt-4 lg:max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('common.brand')}</p>
            <button type="button" className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-brand-600">
              <MapPin className="h-4 w-4 text-brand-600" />
              {displayLocation}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <Link to="/profile" className="flex items-center gap-2 rounded-xl bg-gray-50 py-1.5 pl-1.5 pr-3 hover:bg-brand-50">
                <Avatar name={user.fullName} size="sm" />
                <span className="hidden text-sm font-semibold text-gray-700 sm:inline">
                  {user.fullName.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => navigate('/auth/login')}>
                {t('nav.signIn')}
              </Button>
            )}

            <Link
              to="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600"
              aria-label={t('nav.notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={t('nav.searchPlaceholder')}
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
    </header>
  )
}
