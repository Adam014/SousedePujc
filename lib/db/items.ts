import { supabase } from "../supabase"
import type { Item } from "../types"
import { cacheState, CACHE_DURATION } from "./cache"
import { invalidateCache } from "./cache"
import { ITEM_WITH_RELATIONS } from "./select-patterns"

export async function getItems(): Promise<Item[]> {
  const now = Date.now()
  if (cacheState.items.data && (now - cacheState.items.timestamp) < CACHE_DURATION) {
    return cacheState.items.data
  }

  const { data, error } = await supabase
    .from("items")
    .select(ITEM_WITH_RELATIONS)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching items:", error)
    throw error
  }

  cacheState.items = { data: data || [], timestamp: now }

  return data || []
}

export async function getItemById(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_WITH_RELATIONS)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching item:", error)
    throw error
  }

  return data
}

export async function getItemsByOwner(ownerId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_WITH_RELATIONS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching items by owner:", error)
    throw error
  }

  return data || []
}

export async function createItem(itemData: Omit<Item, "id" | "created_at" | "updated_at">): Promise<Item> {
  const { data, error } = await supabase
    .from("items")
    .insert([itemData])
    .select(ITEM_WITH_RELATIONS)
    .single()

  if (error) {
    console.error("Error creating item:", error)
    throw error
  }

  invalidateCache.items()

  return data
}

export async function updateItem(id: string, itemData: Partial<Item>): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .update({ ...itemData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(ITEM_WITH_RELATIONS)
    .single()

  if (error) {
    console.error("Error updating item:", error)
    throw error
  }

  invalidateCache.items()

  return data
}

export async function deleteItem(id: string): Promise<boolean> {
  const { error } = await supabase.from("items").delete().eq("id", id)

  if (error) {
    console.error("Error deleting item:", error)
    throw error
  }

  invalidateCache.items()

  return true
}
