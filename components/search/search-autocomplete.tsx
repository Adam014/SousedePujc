"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Item } from "@/lib/types"
import { db } from "@/lib/database"
import { fuzzyMatchItems } from "@/lib/search"

interface SearchAutocompleteProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  variant?: "default" | "hero" | "navbar"
}

export default function SearchAutocomplete({
  placeholder = "Hledat předměty...",
  onSearch,
  className = "",
  variant = "default",
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Item[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const itemsLoadedRef = useRef(false)

  // Load items on mount eagerly
  useEffect(() => {
    if (itemsLoadedRef.current) return
    let cancelled = false

    const loadItems = async () => {
      try {
        const items = await db.getItems()
        if (!cancelled) {
          setAllItems(items)
          itemsLoadedRef.current = true
        }
      } catch (error) {
        console.error("Error loading items for search:", error)
      }
    }

    loadItems()
    return () => { cancelled = true }
  }, [])

  // Search when query or items change
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const results = fuzzyMatchItems(allItems, query).slice(0, 5)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 150)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, allItems])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      // Dispatch event so HomeClient can pick it up directly (no URL timing issues)
      window.dispatchEvent(new CustomEvent("app:search", { detail: searchQuery }))
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
        <Search className={`absolute top-1/2 -translate-y-1/2 ${
          variant === "hero" ? "left-5 sm:left-6 h-5 w-5 sm:h-6 sm:w-6 text-blue-500"
          : variant === "navbar" ? "left-3 h-4 w-4 text-gray-400"
          : "left-4 sm:left-5 h-5 w-5 text-blue-400"
        }`} />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className={
            variant === "hero"
              ? "pl-14 sm:pl-16 pr-5 h-14 sm:h-16 text-base sm:text-lg rounded-full border border-gray-200 bg-white shadow-[0_8px_30px_rgba(37,99,235,0.18)] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 placeholder:text-gray-400 transition-all"
            : variant === "navbar"
              ? "pl-9 pr-3 h-9 text-sm rounded-lg bg-gray-100 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:bg-white placeholder:text-gray-400 transition-all"
            : "pl-12 sm:pl-14 pr-4 h-12 sm:h-14 text-sm sm:text-base rounded-full border-0 bg-white shadow-xl ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 placeholder:text-gray-400 transition-all"
          }
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-72 overflow-auto">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(item)}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={item.images[0] || "/placeholder.svg?height=56&width=56"}
                    alt={item.title}
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{item.category?.name}</p>
                  <p className="text-xs sm:text-sm text-blue-600 font-semibold">{item.daily_rate} Kč/den</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
