import { Outlet } from 'react-router-dom'
import { SiteFooter } from '../legal/SiteFooter'
import { BottomNav } from './BottomNav'
import { Header } from './Header'

interface AppLayoutProps {
  showHeader?: boolean
  showBottomNav?: boolean
  showFooter?: boolean
  /** Full viewport height without page scroll — for chat and similar screens. */
  fullHeight?: boolean
}

export function AppLayout({
  showHeader = true,
  showBottomNav = true,
  showFooter = true,
  fullHeight = false,
}: AppLayoutProps) {
  return (
    <div className={fullHeight ? 'h-dvh max-h-dvh overflow-hidden bg-gray-50' : 'min-h-dvh bg-gray-50'}>
      {showHeader && <Header />}

      <main
        className={[
          'mx-auto max-w-lg scroll-safe lg:max-w-2xl',
          fullHeight
            ? 'flex h-full min-h-0 flex-col overflow-hidden'
            : showBottomNav
              ? 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))]'
              : 'pb-6',
        ].join(' ')}
      >
        <Outlet />
        {showFooter && !fullHeight && (
          <SiteFooter className="mt-8 border-t border-gray-200 pt-2" />
        )}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  )
}
