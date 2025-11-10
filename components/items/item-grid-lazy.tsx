"use client"

import { memo } from "react"
import type { Item } from "@/lib/types"
import ItemCard from "./item-card"

interface ItemGridProps {
  items: Item[]
}

// Memoizovaná verze ItemGrid pro lepší výkon
const ItemGrid = memo(function ItemGrid({ items }: ItemGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
})

export default ItemGrid
