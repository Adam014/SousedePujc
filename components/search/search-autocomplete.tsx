"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import { createItemSearch, searchItems, fuzzyMatchItems } from "@/lib/search"

interface SearchAutocompleteProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export default function SearchAutocomplete({
  placeholder = "Hledat předměty...",
  onSearch,
  className = "",
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Item[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadItems = async () => {
      const items = await db.getItems()
      setAllItems(items)
    }
    loadItems()
  }, [])

  // Create search index when items change
  const searchIndex = useMemo(() => createItemSearch(allItems), [allItems])

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Use fuzzy search
    const results = fuzzyMatchItems(allItems, query).slice(0, 5)

    setSuggestions(results)
    setShowSuggestions(results.length > 0)
  }, [query, allItems])

  const handleSearch = (searchQuery: string) => {
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`)
    }
    setShowSuggestions(false)
    setQuery("")
  }

  const handleSuggestionClick = (item: Item) => {
    router.push(`/items/${item.id}`)
    setShowSuggestions(false)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch(query)
    }
    if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(item)}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={item.images[0] || "/placeholder.svg?height=40&width=40"}
                  alt={item.title}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.category?.name}</p>
                  <p className="text-xs text-blue-600 font-medium">{item.daily_rate} Kč/den</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
