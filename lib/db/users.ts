import { supabase } from "../supabase"
import type { User } from "../types"

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    throw error
  }

  return data || []
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching user:", error)
    throw error
  }

  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching user by email:", error)
    return null
  }

  return data
}

export async function createUser(userData: Omit<User, "created_at" | "updated_at">): Promise<User> {
  const { data, error } = await supabase.from("users").insert([userData]).select().single()

  if (error) {
    console.error("Error creating user:", error)
    throw error
  }

  return data
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const updateData = {
    ...userData,
    updated_at: new Date().toISOString(),
  }

  if ('avatar_url' in userData && !userData.avatar_url) {
    updateData.avatar_url = null
  }

  const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating user:", error)
    throw error
  }

  return data
}

export async function updateUserLastSeen(userId: string): Promise<void> {
  const { error } = await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userId)

  if (error) {
    console.error("Error updating user last seen:", error)
  }
}
