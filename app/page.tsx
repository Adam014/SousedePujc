"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import ItemGrid from "@/components/items/item-grid"
import CategoryFilter from "@/components/categories/category-filter"
import SearchAutocomplete from "@/components/search/search-autocomplete"
import ItemFilters, { type FilterValues, type SortValue } from "@/components/items/item-filters"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ServerOffIcon as DatabaseOff, RefreshCcw } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 12

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
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

  const loadItems = useCallback(async () => {
    try {
      // Rychlé načtení z cache pokud existuje
      const data = await db.getItems()
      setItems(data)
      setLoading(false)
      setError("")
      setIsNetworkError(false)

      // Nastavení výchozího cenového rozsahu podle dat
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

      // Kontrola, zda jde o síťovou chybu (Supabase nedostupný)
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
  }, [])

  useEffect(() => {
    const searchFromUrl = searchParams.get("search")
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  // Funkce pro filtrování a řazení předmětů - optimalizováno
  const filteredAndSortedItems = useMemo(() => {
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
    result = result.filter((item) => {
      const price = item.daily_rate || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
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

  // Aplikace filtrů a řazení při změně dat
  useEffect(() => {
    setFilteredItems(filteredAndSortedItems)
    setCurrentPage(1) // Reset na první stránku při změně filtrů
  }, [filteredAndSortedItems])

  // Stránkování - optimalizováno
  const displayedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredItems.slice(startIndex, endIndex)
  }, [filteredItems, currentPage])

  // Výpočet celkového počtu stránek
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)

  // Výpočet min a max ceny pro filtry
  const minMaxPrice = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 10000 }

    const prices = items.map((item) => item.daily_rate || 0)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices, 1000), // Minimálně 1000 Kč jako maximum
    }
  }, [items])

  // Funkce pro generování stránek pro paginaci - optimalizováno
  const paginationItems = useMemo(() => {
    const pages: JSX.Element[] = []

    if (totalPages <= 1) return pages

    // Vždy zobrazit první stránku
    pages.push(
      <PaginationItem key="page-1">
        <PaginationLink isActive={currentPage === 1} onClick={() => setCurrentPage(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Přidat elipsu, pokud je aktuální stránka > 3
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis-1">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>,
      )
    }

    // Přidat stránky kolem aktuální stránky
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue // Přeskočit první a poslední stránku, ty jsou přidány zvlášť

      pages.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Přidat elipsu, pokud je aktuální stránka < totalPages - 2
    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis-2">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>,
      )
    }

    // Přidat poslední stránku, pokud existuje více než 1 stránka
    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink isActive={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return pages
  }, [currentPage, totalPages])

  // Funkce pro reset filtrů
  const handleResetFilters = useCallback(() => {
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
              onClick={() => loadItems()}
              variant={isNetworkError ? "destructive" : "default"}
              className="flex items-center"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Zkusit znovu
            </Button>
          </div>
        </Alert>

        {/* Hero sekce pro případ výpadku */}
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

        {/* Vyhledávání */}
        <SearchAutocomplete placeholder="Co hledáte?" onSearch={setSearchQuery} className="max-w-md mx-auto" />
      </div>

      {/* Filtry */}
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {/* Pokročilé filtry a řazení */}
      <ItemFilters
        onFilterChange={setFilters}
        onSortChange={setSortBy}
        minPrice={minMaxPrice.min}
        maxPrice={minMaxPrice.max}
        activeFilters={filters}
        activeSort={sortBy}
      />

      {/* Nadpis sekce */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {selectedCategory || searchQuery || Object.keys(filters).length > 0
            ? "Filtrované předměty"
            : "Všechny předměty"}
          <span className="text-gray-500 text-lg ml-2">({filteredItems.length})</span>
        </h2>
      </div>

      {/* Zobrazení předmětů */}
      {filteredItems.length > 0 ? (
        <>
          <ItemGrid items={displayedItems} />

          {/* Stránkování */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {paginationItems}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-2">Žádné předměty nenalezeny</h3>
          <p className="text-gray-500 mb-6">Zkuste upravit filtry nebo vyhledávání pro zobrazení více předmětů.</p>
          <Button onClick={handleResetFilters}>
            Resetovat všechny filtry
          </Button>
        </div>
      )}
    </div>
  )
}
