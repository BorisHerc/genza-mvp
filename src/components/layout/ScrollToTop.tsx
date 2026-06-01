import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset window scroll on route changes so new pages open at the top. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
