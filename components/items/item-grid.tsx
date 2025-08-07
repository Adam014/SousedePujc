import { memo } from "react"
import type { Item } from "@/lib/types"
import ItemCard from "./item-card"

interface ItemGridProps {
  items: Item[]
}

function ItemGrid({ items }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Žádné předměty nebyly nalezeny.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

export default memo(ItemGrid)
