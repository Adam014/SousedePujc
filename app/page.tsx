"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import ItemGrid from "@/components/items/item-grid"
import CategoryFilter from "@/components/categories/category-filter"
import SearchAutocomplete from "@/components/search/search-autocomplete"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ServerOffIcon as DatabaseOff, RefreshCcw, MapIcon, Grid3X3 } from "lucide-react"
import dynamic from "next/dynamic"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dynamicky importujeme mapu, aby se vyhnulo problémům s SSR
const ItemMap = dynamic(() => import("@/components/map/item-map"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
})

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")

  const searchParams = useSearchParams()

  const loadItems = async () => {
    try {
      setLoading(true)
      setError("")
      setIsNetworkError(false)
      const data = await db.getItems()
      setItems(data)
      setFilteredItems(data)
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
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    const searchFromUrl = searchParams.get("search")
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    let filtered = items

    // Filtrování podle kategorie
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category_id === selectedCategory)
    }

    // Filtrování podle vyhledávání
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Zobrazit pouze dostupné předměty
    filtered = filtered.filter((item) => item.is_available)

    setFilteredItems(filtered)
  }, [items, selectedCategory, searchQuery])

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

      {/* Přepínač zobrazení */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {selectedCategory || searchQuery ? "Filtrované předměty" : "Všechny předměty"}
          <span className="text-gray-500 text-lg ml-2">({filteredItems.length})</span>
        </h2>

        <div className="flex items-center space-x-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "map")} className="w-auto">
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="grid" className="flex items-center">
                <Grid3X3 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Seznam</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center">
                <MapIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Mapa</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Zobrazení předmětů */}
      {viewMode === "grid" ? (
        <ItemGrid items={filteredItems} />
      ) : (
        <div className="mt-4">
          <ItemMap items={filteredItems} />
        </div>
      )}
    </div>
  )
}
