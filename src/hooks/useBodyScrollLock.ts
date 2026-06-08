import { useEffect } from 'react'

/** Prevents the document from scrolling behind a full-screen panel (e.g. chat). */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const { body, documentElement } = document
    const previousOverflow = body.style.overflow
    const previousHtmlOverflow = documentElement.style.overflow
    const previousBodyHeight = body.style.height
    const previousHtmlHeight = documentElement.style.height

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'
    body.style.height = '100%'
    documentElement.style.height = '100%'

    return () => {
      body.style.overflow = previousOverflow
      documentElement.style.overflow = previousHtmlOverflow
      body.style.height = previousBodyHeight
      documentElement.style.height = previousHtmlHeight
    }
  }, [active])
}
