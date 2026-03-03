"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import { fuzzyMatchItems } from "@/lib/search"
import ItemGrid from "@/components/items/item-grid"
import CategoryFilter from "@/components/categories/category-filter"
import type { FilterValues, SortValue } from "@/components/items/item-filters"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ServerOffIcon as DatabaseOff, RefreshCcw, X, Search } from "lucide-react"

const SearchAutocomplete = dynamic(() => import("@/components/search/search-autocomplete"), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-100 rounded-md max-w-xs sm:max-w-md mx-auto" />,
})

const ItemFilters = dynamic(() => import("@/components/items/item-filters"))

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 12

interface HomeClientProps {
  initialItems: Item[]
}

export default function HomeClient({ initialItems }: HomeClientProps) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterValues>(() => {
    if (initialItems.length > 0) {
      const prices = initialItems.map((item) => item.daily_rate || 0)
      return {
        priceRange: [Math.min(...prices, 0), Math.max(...prices, 10000)],
        availability: "all",
      }
    }
    return { priceRange: [0, 10000], availability: "all" }
  })
  const [sortBy, setSortBy] = useState<SortValue>("newest")

  const router = useRouter()
  const pathname = usePathname()
  const catalogRef = useRef<HTMLDivElement>(null)

  // Sync URL params to state on initial load
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const categoryFromUrl = params.get("category")
      const searchFromUrl = params.get("search")
      const sortFromUrl = params.get("sort") as SortValue
      const availabilityFromUrl = params.get("availability") as "all" | "available" | "unavailable"
      const pageFromUrl = parseInt(params.get("page") || "1")

      setSelectedCategory(categoryFromUrl)
      setSearchQuery(searchFromUrl || "")
      if (sortFromUrl && ["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"].includes(sortFromUrl)) {
        setSortBy(sortFromUrl)
      }
      if (availabilityFromUrl && ["all", "available", "unavailable"].includes(availabilityFromUrl)) {
        setFilters(prev => ({ ...prev, availability: availabilityFromUrl }))
      }
      if (pageFromUrl > 0) setCurrentPage(pageFromUrl)

      // Scroll to catalog if there's a search query
      if (searchFromUrl) {
        setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      }
    }

    // Handle direct search events from header SearchAutocomplete
    const handleSearchEvent = (e: Event) => {
      const query = (e as CustomEvent).detail as string
      setSearchQuery(query)
      setCurrentPage(1)
      setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }

    syncFromUrl()

    window.addEventListener("popstate", syncFromUrl)
    window.addEventListener("app:search", handleSearchEvent)

    return () => {
      window.removeEventListener("popstate", syncFromUrl)
      window.removeEventListener("app:search", handleSearchEvent)
    }
  }, [])

  // Update URL when filters change
  const updateUrl = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(window.location.search)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || value === "newest" || (key === "page" && value === 1)) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname])

  // Handlers that update both state and URL
  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    updateUrl({ category, page: null })
  }, [updateUrl])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    updateUrl({ search: query || null, page: null })
    // Scroll to catalog after search
    setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }, [updateUrl])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    setCurrentPage(1)
    updateUrl({ search: null, page: null })
  }, [updateUrl])

  const handleSortChange = useCallback((sort: SortValue) => {
    setSortBy(sort)
    updateUrl({ sort: sort === "newest" ? null : sort })
  }, [updateUrl])

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters)
    setCurrentPage(1)
    updateUrl({
      availability: newFilters.availability === "all" ? null : newFilters.availability ?? null,
      page: null
    })
  }, [updateUrl])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrl({ page: page === 1 ? null : page })
  }, [updateUrl])

  const loadItems = useCallback(async () => {
    try {
      const data = await db.getItems()
      setItems(data)
      setLoading(false)
      setError("")
      setIsNetworkError(false)

      if (data.length > 0) {
        const prices = data.map((item) => item.daily_rate || 0)
        const minPrice = Math.min(...prices, 0)
        const maxPrice = Math.max(...prices, 10000)

        setFilters((prev) => ({
          ...prev,
          priceRange: [minPrice, maxPrice],
        }))
      }
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

  // Filter and sort items — computed directly, no effect delay
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    if (selectedCategory) {
      result = result.filter((item) => item.category_id === selectedCategory)
    }

    if (searchQuery && searchQuery.length >= 2) {
      const fuzzyResults = fuzzyMatchItems(result, searchQuery)
      result = fuzzyResults
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category?.name.toLowerCase().includes(query),
      )
    }

    result = result.filter((item) => {
      const price = item.daily_rate || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    if (filters.availability === "available") {
      result = result.filter((item) => item.is_available)
    } else if (filters.availability === "unavailable") {
      result = result.filter((item) => !item.is_available)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price_asc":
          return (a.daily_rate || 0) - (b.daily_rate || 0)
        case "price_desc":
          return (b.daily_rate || 0) - (a.daily_rate || 0)
        case "name_asc":
          return a.title.localeCompare(b.title)
        case "name_desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return result
  }, [items, selectedCategory, searchQuery, filters, sortBy])

  // Paginate directly from the memo — no intermediate state
  const displayedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredAndSortedItems.slice(startIndex, endIndex)
  }, [filteredAndSortedItems, currentPage])

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE)

  // Reset page when filtered results change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, filters, sortBy])

  const minMaxPrice = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 10000 }

    const prices = items.map((item) => item.daily_rate || 0)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices, 1000),
    }
  }, [items])

  const paginationItems = useMemo(() => {
    const pages: React.JSX.Element[] = []

    if (totalPages <= 1) return pages

    pages.push(
      <PaginationItem key="page-1" className="hidden sm:list-item">
        <PaginationLink isActive={currentPage === 1} onClick={() => handlePageChange(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis-1" className="hidden sm:list-item">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>,
      )
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue

      pages.push(
        <PaginationItem key={`page-${i}`} className="hidden sm:list-item">
          <PaginationLink isActive={currentPage === i} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis-2" className="hidden sm:list-item">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>,
      )
    }

    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={`page-${totalPages}`} className="hidden sm:list-item">
          <PaginationLink isActive={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return pages
  }, [currentPage, totalPages, handlePageChange])

  const handleResetFilters = useCallback(() => {
    setSelectedCategory(null)
    setSearchQuery("")
    setFilters({
      priceRange: [minMaxPrice.min, minMaxPrice.max],
      availability: "all",
    })
    setSortBy("newest")
    setCurrentPage(1)
    router.push(pathname, { scroll: false })
  }, [minMaxPrice, router, pathname])

  const hasActiveSearch = searchQuery.length > 0

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
              onClick={() => loadItems()}
              variant={isNetworkError ? "destructive" : "default"}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Zkusit znovu
            </Button>
          </div>
        </Alert>

        {isNetworkError && (
          <div className="text-center mb-8 sm:mb-12 py-4 sm:py-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-4 sm:mb-6 px-4">
              Půjčte si od sousedů
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Objevte předměty ve vaší komunitě. Půjčte si to, co potřebujete, nebo nabídněte své věci ostatním. Šetřete
              peníze a životní prostředí.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Hero sekce */}
      <div className="text-center mb-8 sm:mb-12 py-4 sm:py-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-4 sm:mb-6">
          Půjčte si od sousedů
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
          Objevte předměty ve vaší komunitě. Půjčte si to, co potřebujete, nebo nabídněte své věci ostatním. Šetřete
          peníze a životní prostředí.
        </p>

        {/* Vyhledávání */}
        <SearchAutocomplete placeholder="Co hledáte?" onSearch={handleSearchChange} className="max-w-xs sm:max-w-md mx-auto" />
      </div>

      {/* Filtry */}
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      {/* Pokročilé filtry a řazení */}
      <ItemFilters
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        minPrice={minMaxPrice.min}
        maxPrice={minMaxPrice.max}
        activeFilters={filters}
        activeSort={sortBy}
      />

      {/* Catalog section */}
      <div ref={catalogRef}>
        {/* Active search indicator */}
        {hasActiveSearch && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Search className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-800">
              Výsledky pro: <strong>&quot;{searchQuery}&quot;</strong>
            </span>
            <span className="text-sm text-blue-600">({filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? "předmět" : "předmětů"})</span>
            <button
              onClick={handleClearSearch}
              className="ml-auto text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
              aria-label="Zrušit hledání"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Nadpis sekce */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {hasActiveSearch
              ? "Výsledky hledání"
              : selectedCategory
                ? "Filtrované předměty"
                : "Všechny předměty"}
            {!hasActiveSearch && (
              <span className="text-gray-500 text-base sm:text-lg ml-2">({filteredAndSortedItems.length})</span>
            )}
          </h2>
        </div>

        {/* Zobrazení předmětů */}
        {filteredAndSortedItems.length > 0 ? (
          <>
            <ItemGrid items={displayedItems} />

            {/* Stránkování */}
            {totalPages > 1 && (
              <Pagination className="mt-6 sm:mt-8">
                <PaginationContent className="gap-1 sm:gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="touch-target-sm"
                    />
                  </PaginationItem>

                  {/* Mobile: show current page indicator */}
                  <PaginationItem className="sm:hidden">
                    <span className="flex h-9 items-center justify-center px-3 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                  </PaginationItem>

                  {/* Desktop: show page numbers */}
                  {paginationItems}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="touch-target-sm"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {hasActiveSearch
                ? `Žádné předměty pro "${searchQuery}"`
                : "Žádné předměty nenalezeny"}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveSearch
                ? "Zkuste jiný hledaný výraz nebo resetujte filtry."
                : "Zkuste upravit filtry nebo vyhledávání pro zobrazení více předmětů."}
            </p>
            <Button onClick={handleResetFilters}>
              Resetovat všechny filtry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
