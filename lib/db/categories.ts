import { supabase } from "../supabase"
import type { Category } from "../types"
import { cacheState, CATEGORY_CACHE_DURATION } from "./cache"

export async function getCategories(): Promise<Category[]> {
  const now = Date.now()
  if (cacheState.categories.data && (now - cacheState.categories.timestamp) < CATEGORY_CACHE_DURATION) {
    return cacheState.categories.data
  }

  const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    if (cacheState.categories.data) return cacheState.categories.data
    throw error
  }

  cacheState.categories = { data: data || [], timestamp: now }

  return data || []
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching category:", error)
    throw error
  }

  return data
}
