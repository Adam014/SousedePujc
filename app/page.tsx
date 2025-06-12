"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import ItemGrid from "@/components/items/item-grid"
import CategoryFilter from "@/components/categories/category-filter"
import SearchAutocomplete from "@/components/search/search-autocomplete"

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const searchParams = useSearchParams()

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        setError("")
        const data = await db.getItems()
        setItems(data)
        setFilteredItems(data)
      } catch (error) {
        console.error("Error loading items:", error)
        setError("Chyba při načítání předmětů")
      } finally {
        setLoading(false)
      }
    }
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
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Zkusit znovu
          </button>
        </div>
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

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl text-center shadow-soft card-hover">
          <div className="text-4xl font-bold text-blue-600 mb-3">{items.length}</div>
          <div className="text-gray-700 font-medium">Dostupných předmětů</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl text-center shadow-soft card-hover">
          <div className="text-4xl font-bold text-green-600 mb-3">150+</div>
          <div className="text-gray-700 font-medium">Spokojených uživatelů</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl text-center shadow-soft card-hover">
          <div className="text-4xl font-bold text-purple-600 mb-3">500+</div>
          <div className="text-gray-700 font-medium">Úspěšných výpůjček</div>
        </div>
      </div>

      {/* Seznam předmětů */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold mb-4">
          {selectedCategory || searchQuery ? "Filtrované předměty" : "Všechny předměty"}
          <span className="text-gray-500 text-lg ml-2">({filteredItems.length})</span>
        </h2>
      </div>

      <ItemGrid items={filteredItems} />
    </div>
  )
}
