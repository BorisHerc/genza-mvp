import { Bell, ChevronDown, MapPin, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { useTranslation } from '../../context/LocaleContext'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface HeaderProps {
  location?: string
}

function isTaskSearchRoute(pathname: string): boolean {
  return pathname === '/browse' || pathname === '/'
}

function readUrlSearchQuery(search: string): string {
  return new URLSearchParams(search).get('q') ?? ''
}

export function Header({ location = 'Mostar, BiH' }: HeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { unreadCount } = useNotifications()
  const displayLocation = isAuthenticated ? user?.location ?? location : location
  const onSearchRoute = isTaskSearchRoute(pathname)
  const urlQuery = onSearchRoute ? readUrlSearchQuery(search) : ''
  const [searchValue, setSearchValue] = useState(urlQuery)
  const skipDebounceRef = useRef(false)

  useEffect(() => {
    if (onSearchRoute) {
      setSearchValue(urlQuery)
      return
    }
    setSearchValue('')
  }, [urlQuery, onSearchRoute])

  const commitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      console.log('[GENZA SEARCH] input commit', { value: trimmed, from: pathname })

      navigate(
        {
          pathname: '/browse',
          search: trimmed ? `?q=${encodeURIComponent(trimmed)}` : '',
        },
        { replace: true },
      )
    },
    [navigate, pathname],
  )

  const clearSearch = useCallback(() => {
    skipDebounceRef.current = true
    setSearchValue('')
    navigate({ pathname: '/browse', search: '' }, { replace: true })
  }, [navigate])

  const handleInputChange = (value: string) => {
    console.log('[GENZA SEARCH] input change', { value })
    setSearchValue(value)
  }

  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false
      return
    }

    const timer = window.setTimeout(() => {
      const next = searchValue.trim()
      const current = urlQuery.trim()
      if (next !== current) {
        commitSearch(searchValue)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [searchValue, urlQuery, commitSearch])

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
            value={searchValue}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitSearch(searchValue)
              }
            }}
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('nav.searchPlaceholder')}
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          {searchValue.trim() && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={t('search.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
