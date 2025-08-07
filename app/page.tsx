"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import ItemGrid from "@/components/items/item-grid"
import CategoryFilter from "@/components/categories/category-filter"
import SearchAutocomplete from "@/components/search/search-autocomplete"
import ItemFilters, { type FilterValues, type SortValue } from "@/components/items/item-filters"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ServerOffIcon as DatabaseOff, RefreshCcw } from 'lucide-react'

// Lazy load pagination component
const Pagination = dynamic(() => import("@/components/ui/pagination").then(mod => ({ 
  default: memo(mod.Pagination) 
})), {
  loading: () => <div className="h-12 animate-pulse bg-gray-200 rounded" />
})

const ITEMS_PER_PAGE = 12

// Memoized filter function
const createFilterFunction = (selectedCategory: string | null, searchQuery: string, filters: FilterValues, sortBy: SortValue) => {
  return (items: Item[]) => {
    let result = [...items]

    // Filtrování podle kategorie
    if (selectedCategory) {
      result = result.filter((item) => item.category_id === selectedCategory)
    }

    // Filtrování podle vyhledávání
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category?.name.toLowerCase().includes(query),
      )
    }

    // Filtrování podle ceny
    const [minPrice, maxPrice] = filters.priceRange
    result = result.filter((item) => {
      const price = item.price || 0
      return price >= minPrice && price <= maxPrice
    })

    // Filtrování podle dostupnosti
    if (filters.availability === "available") {
      result = result.filter((item) => item.is_available)
    } else if (filters.availability === "unavailable") {
      result = result.filter((item) => !item.is_available)
    }

    // Řazení
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price_asc":
          return (a.price || 0) - (b.price || 0)
        case "price_desc":
          return (b.price || 0) - (a.price || 0)
        case "name_asc":
          return a.title.localeCompare(b.title)
        case "name_desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return result
  }
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterValues>({
    priceRange: [0, 10000],
    availability: "all",
  })
  const [sortBy, setSortBy] = useState<SortValue>("newest")

  const searchParams = useSearchParams()

  // Memoized filter function
  const filterFunction = useMemo(
    () => createFilterFunction(selectedCategory, searchQuery, filters, sortBy),
    [selectedCategory, searchQuery, filters, sortBy]
  )

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    if (items.length === 0) return []
    return filterFunction(items)
  }, [items, filterFunction])

  // Memoized displayed items for current page
  const displayedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredItems.slice(startIndex, endIndex)
  }, [filteredItems, currentPage])

  // Memoized total pages
  const totalPages = useMemo(() => Math.ceil(filteredItems.length / ITEMS_PER_PAGE), [filteredItems.length])

  // Memoized min/max price
  const minMaxPrice = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 10000 }

    const prices = items.map((item) => item.price || 0)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices, 1000),
    }
  }, [items])

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      setIsNetworkError(false)
      const data = await db.getItems()
      setItems(data)

      // Nastavení výchozího cenového rozsahu podle dat
      const prices = data.map((item) => item.price || 0)
      const minPrice = Math.min(...prices, 0)
      const maxPrice = Math.max(...prices, 10000)

      setFilters((prev) => ({
        ...prev,
        priceRange: [minPrice, maxPrice],
      }))
    } catch (error: any) {
      console.error("Error loading items:", error)

      const isNetworkErr =
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network request failed")

      setIsNetworkError(isNetworkErr)
      setError(isNetworkErr ? "Nepodařilo se připojit k databázi" : "Chyba při načítání předmětů")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    const searchFromUrl = searchParams.get("search")
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery, filters, sortBy])

  // Memoized callbacks
  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters)
  }, [])

  const handleSortChange = useCallback((newSort: SortValue) => {
    setSortBy(newSort)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const resetFilters = useCallback(() => {
    setSelectedCategory(null)
    setSearchQuery("")
    setFilters({
      priceRange: [minMaxPrice.min, minMaxPrice.max],
      availability: "all",
    })
    setSortBy("newest")
  }, [minMaxPrice])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant={isNetworkError ? "destructive" : "default"} className="mb-6 max-w-3xl mx-auto">
          <div className="flex items-start">
            {isNetworkError && <DatabaseOff className="h-5 w-5 mr-2 mt-0.5" />}
            <div>
              <AlertTitle className="text-lg font-semibold mb-2">
                {isNetworkError ? "Problém s připojením k databázi" : "Chyba při načítání"}
              </AlertTitle>
              <AlertDescription>
                {isNetworkError ? (
                  <div className="space-y-4">
                    <p>
                      Nepodařilo se připojit k databázovému serveru Supabase. Momentálně může být služba nedostupná nebo
                      přetížená.
                    </p>
                    <p>Děkujeme za trpělivost, zkuste to prosím za chvíli znovu.</p>
                  </div>
                ) : (
                  <p>{error}</p>
                )}
              </AlertDescription>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={loadItems}
              variant={isNetworkError ? "destructive" : "default"}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Zkusit znovu
            </Button>
          </div>
        </Alert>

        {isNetworkError && (
          <div className="text-center mb-12 py-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-6">
              Půjčte si od sousedů
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Objevte předměty ve vaší komunitě. Půjčte si to, co potřebujete, nebo nabídněte své věci ostatním. Šetřete
              peníze a životní prostředí.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero sekce */}
      <div className="text-center mb-12 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-6">
          Půjčte si od sousedů
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Objevte předměty ve vaší komunitě. Půjčte si to, co potřebujete, nebo nabídněte své věci ostatním. Šetřete
          peníze a životní prostředí.
        </p>

        <SearchAutocomplete placeholder="Co hledáte?" onSearch={handleSearchChange} className="max-w-md mx-auto" />
      </div>

      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      <ItemFilters
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        minPrice={minMaxPrice.min}
        maxPrice={minMaxPrice.max}
        activeFilters={filters}
        activeSort={sortBy}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {selectedCategory || searchQuery || Object.keys(filters).length > 0
            ? "Filtrované předměty"
            : "Všechny předměty"}
          <span className="text-gray-500 text-lg ml-2">({filteredItems.length})</span>
        </h2>
      </div>

      {filteredItems.length > 0 ? (
        <>
          <ItemGrid items={displayedItems} />

          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-2">Žádné předměty nenalezeny</h3>
          <p className="text-gray-500 mb-6">Zkuste upravit filtry nebo vyhledávání pro zobrazení více předmětů.</p>
          <Button onClick={resetFilters}>
            Resetovat všechny filtry
          </Button>
        </div>
      )}
    </div>
  )
}
