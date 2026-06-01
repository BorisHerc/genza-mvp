import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getActiveLocale,
  loadStoredLocale,
  setActiveLocale,
  translate,
  type Locale,
} from '../lib/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translate
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? loadStoredLocale())

  useEffect(() => {
    setActiveLocale(locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    setActiveLocale(next)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: translate,
    }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useTranslation() {
  const context = useContext(LocaleContext)
  if (!context) {
    return {
      locale: getActiveLocale(),
      setLocale: setActiveLocale,
      t: translate,
    }
  }
  return context
}
