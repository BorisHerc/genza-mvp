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
  formatBudget as formatBudgetAmount,
  formatCurrency as formatCurrencyAmount,
  getActiveCurrency,
  getCurrencyLabel,
  getCurrencySymbol,
  getDefaultCurrencyForLocation,
  isSupportedCurrency,
  loadStoredCurrency,
  resolveTaskCurrency,
  setActiveCurrency,
  type FormatCurrencyOptions,
  type SupportedCurrency,
} from '../lib/currency'
import { useAuth } from './AuthContext'

interface CurrencyContextValue {
  currency: SupportedCurrency
  setCurrency: (currency: SupportedCurrency) => void
  formatCurrency: (amount: number, options?: FormatCurrencyOptions) => string
  formatBudget: (amount: number, type: 'fixed' | 'hourly', currency?: SupportedCurrency) => string
  getCurrencySymbol: (currency?: SupportedCurrency) => string
  getCurrencyLabel: (currency: SupportedCurrency) => string
  resolveTaskCurrency: (
    currency: string | null | undefined,
    location?: string | null,
  ) => SupportedCurrency
  suggestCurrencyForLocation: (location: string) => SupportedCurrency
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth()
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => loadStoredCurrency())

  useEffect(() => {
    if (profile?.currency && isSupportedCurrency(profile.currency)) {
      setCurrencyState(profile.currency)
      setActiveCurrency(profile.currency)
      return
    }

    if (user?.currency && isSupportedCurrency(user.currency)) {
      setCurrencyState(user.currency)
      setActiveCurrency(user.currency)
      return
    }

    const fromLocation = getDefaultCurrencyForLocation(profile?.location ?? user?.location)
    setCurrencyState(fromLocation)
    setActiveCurrency(fromLocation)
  }, [profile?.currency, profile?.location, user?.currency, user?.location])

  const setCurrency = useCallback((next: SupportedCurrency) => {
    setCurrencyState(next)
    setActiveCurrency(next)
  }, [])

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      formatCurrency: (amount, options) =>
        formatCurrencyAmount(amount, { ...options, currency: options?.currency ?? currency }),
      formatBudget: (amount, type, taskCurrency) =>
        formatBudgetAmount(amount, type, taskCurrency ?? currency),
      getCurrencySymbol: (code) => getCurrencySymbol(code ?? currency),
      getCurrencyLabel,
      resolveTaskCurrency,
      suggestCurrencyForLocation: getDefaultCurrencyForLocation,
    }),
    [currency, setCurrency],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    return {
      currency: getActiveCurrency(),
      setCurrency: setActiveCurrency,
      formatCurrency: formatCurrencyAmount,
      formatBudget: formatBudgetAmount,
      getCurrencySymbol,
      getCurrencyLabel,
      resolveTaskCurrency,
      suggestCurrencyForLocation: getDefaultCurrencyForLocation,
    }
  }
  return context
}
