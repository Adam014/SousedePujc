"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"
import { db } from "@/lib/database"
import { categoryIcons } from "./category-icons"
import { Package, ChevronDown, ChevronUp } from "lucide-react"

interface CategoryFilterProps {
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
}

const MOBILE_VISIBLE_COUNT = 5 // "Vše" + 5 categories = 6 items (2 rows of 3)

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      const data = await db.getCategories()
      setCategories(data)
    }
    loadCategories()
  }, [])

  // Auto-expand if selected category is in hidden section
  useEffect(() => {
    if (selectedCategory) {
      const selectedIndex = categories.findIndex(c => c.id === selectedCategory)
      if (selectedIndex >= MOBILE_VISIBLE_COUNT) {
        setIsExpanded(true)
      }
    }
  }, [selectedCategory, categories])

  const visibleCategories = isExpanded ? categories : categories.slice(0, MOBILE_VISIBLE_COUNT)
  const hiddenCount = categories.length - MOBILE_VISIBLE_COUNT
  const hasMore = hiddenCount > 0

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Kategorie</h3>

      {/* Mobile: Grid with expand/collapse */}
      <div className="sm:hidden">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className="h-10 text-xs"
          >
            Vše
          </Button>
          {visibleCategories.map((category) => {
            const IconComponent = categoryIcons[category.icon as keyof typeof categoryIcons] || Package
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className="h-10 text-xs gap-1 px-2"
              >
                <IconComponent className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{category.name}</span>
              </Button>
            )
          })}

          {/* Show more/less button */}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-10 text-xs gap-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 col-span-3 mt-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Méně kategorií
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Více kategorií (+{hiddenCount})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Desktop: Flex wrap - show all */}
      <div className="hidden sm:flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
        >
          Vše
        </Button>
        {categories.map((category) => {
          const IconComponent = categoryIcons[category.icon as keyof typeof categoryIcons] || Package
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              <span>{category.name}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
