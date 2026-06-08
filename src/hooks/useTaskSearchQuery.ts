import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

/** Reads `q` from the URL search string (location.search). */
export function useTaskSearchQuery(): string {
  const { search } = useLocation()

  return useMemo(() => new URLSearchParams(search).get('q') ?? '', [search])
}
