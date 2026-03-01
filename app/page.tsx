import { createClient } from "@supabase/supabase-js"
import { Suspense } from "react"
import HomeClient from "./home-client"
import type { Item } from "@/lib/types"

async function getInitialItems(): Promise<Item[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    )

    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        owner:users!items_owner_id_fkey(*),
        category:categories!items_category_id_fkey(*)
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Server fetch error:", error)
      return []
    }

    return (data as Item[]) || []
  } catch (error) {
    console.error("Server fetch failed:", error)
    return []
  }
}

export const revalidate = 30

export default async function HomePage() {
  const initialItems = await getInitialItems()

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <HomeClient initialItems={initialItems} />
    </Suspense>
  )
}
