'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export interface FilterParams {
  search: string
  category: string | null
  minPrice: number
  maxPrice: number
  availability: 'all' | 'available' | 'unavailable'
  sort: string
  page: number
}

export interface PriceRange {
  min: number
  max: number
}

export function useFilterParams(priceRange: PriceRange) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo((): FilterParams => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category'),
    minPrice: parseInt(searchParams.get('minPrice') || String(priceRange.min)) || priceRange.min,
    maxPrice: parseInt(searchParams.get('maxPrice') || String(priceRange.max)) || priceRange.max,
    availability: (searchParams.get('availability') as FilterParams['availability']) || 'all',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1') || 1,
  }), [searchParams, priceRange.min, priceRange.max])

  const updateFilters = useCallback((updates: Partial<FilterParams>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      // Remove params that are at default values
      if (
        value === null ||
        value === '' ||
        value === undefined ||
        (key === 'minPrice' && value === priceRange.min) ||
        (key === 'maxPrice' && value === priceRange.max) ||
        (key === 'availability' && value === 'all') ||
        (key === 'sort' && value === 'newest') ||
        (key === 'page' && value === 1)
      ) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    // Reset page when filters change (unless page was explicitly updated)
    if (!('page' in updates)) {
      params.delete('page')
    }

    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, searchParams, priceRange.min, priceRange.max])

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  return { filters, updateFilters, clearFilters }
}
