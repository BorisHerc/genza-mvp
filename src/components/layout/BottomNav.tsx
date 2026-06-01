import { Home, MessageCircle, Plus, Search, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

export function BottomNav() {
  const { t } = useTranslation()
  const { unreadMessageCount } = useNotifications()

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/browse', label: t('nav.browse'), icon: Search },
    { path: '/post', label: t('nav.post'), icon: Plus, accent: true },
    { path: '/messages', label: t('nav.chat'), icon: MessageCircle, showUnread: true },
    { path: '/profile', label: t('nav.profile'), icon: User },
  ] as const

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 shadow-nav backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-end justify-around px-1 pb-2 pt-1.5 lg:max-w-2xl">
        {navItems.map(({ path, label, icon: Icon, ...rest }) => {
          const accent = 'accent' in rest && rest.accent
          const showUnread = 'showUnread' in rest && rest.showUnread

          if (accent) {
            return (
              <NavLink
                key={path}
                to={path}
                className="group -mt-5 flex flex-col items-center gap-1"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200',
                        isActive
                          ? 'bg-brand-700 text-white shadow-brand-600/30'
                          : 'bg-brand-600 text-white shadow-brand-500/25 group-hover:bg-brand-700 group-active:scale-95',
                      )}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </span>
                    <span className="text-[10px] font-semibold text-brand-700">
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          }

          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'relative flex min-w-[60px] min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-colors',
                  isActive
                    ? 'text-brand-600'
                    : 'text-gray-400 hover:text-gray-600',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon
                      className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')}
                    />
                    {showUnread && unreadMessageCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isActive && 'font-semibold',
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <span className="h-0.5 w-4 rounded-full bg-brand-600" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
