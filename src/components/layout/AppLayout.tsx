import { Outlet } from 'react-router-dom'
import { SiteFooter } from '../legal/SiteFooter'
import { BottomNav } from './BottomNav'
import { Header } from './Header'

interface AppLayoutProps {
  showHeader?: boolean
  showBottomNav?: boolean
}

export function AppLayout({
  showHeader = true,
  showBottomNav = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-dvh bg-gray-50">
      {showHeader && <Header />}

      <main
        className={[
          'mx-auto max-w-lg scroll-safe lg:max-w-2xl',
          showBottomNav ? 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))]' : 'pb-6',
        ].join(' ')}
      >
        <Outlet />
        <SiteFooter className="mt-8 border-t border-gray-200 pt-2" />
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  )
}
