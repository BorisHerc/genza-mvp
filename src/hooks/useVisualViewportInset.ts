import { useEffect, useState } from 'react'

/**
 * Returns the bottom inset (px) when the mobile virtual keyboard or browser chrome
 * reduces the visual viewport — works on Android Chrome and iOS Safari.
 */
export function useVisualViewportInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      )
      setInset(Math.round(keyboardInset))
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)

    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return inset
}
