"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"
import { db } from "@/lib/database"
import { categoryIcons } from "./category-icons"
import { Package } from "lucide-react"

interface CategoryFilterProps {
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      const data = await db.getCategories()
      setCategories(data)
    }
    loadCategories()
  }, [])

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Kategorie</h3>
      <div className="flex flex-wrap gap-2">
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
              className="flex items-center space-x-2"
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
