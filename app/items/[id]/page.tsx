import { notFound } from "next/navigation"
import { db } from "@/lib/database"
import ItemDetailClient from "./item-detail-client"

export const revalidate = 30

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let item = null
  try {
    item = await db.getItemById(id)
  } catch (error) {
    console.error("Error fetching item:", error)
  }

  if (!item) {
    notFound()
  }

  return <ItemDetailClient item={item} />
}
