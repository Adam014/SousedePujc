import { supabase } from "../supabase"
import type { User } from "../types"

// Public-safe columns only - never expose email, phone, address, is_admin in general queries
const USER_PUBLIC_COLUMNS = "id, name, avatar_url, is_verified, reputation_score, bio, created_at, last_active, last_seen, updated_at"

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select(USER_PUBLIC_COLUMNS).order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    throw error
  }

  return (data as unknown as User[]) || []
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select(USER_PUBLIC_COLUMNS).eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching user:", error)
    throw error
  }

  return data as unknown as User | null
}

// Returns the FULL profile of the currently authenticated user via secure RPC
export async function getMyProfile(): Promise<User | null> {
  const { data, error } = await supabase.rpc("get_my_profile")

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching my profile:", error)
    throw error
  }

  return data
}

// Check if an email is already registered (safe for registration flow)
export async function checkUserExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_user_exists", { user_email: email })

  if (error) {
    console.error("Error checking user exists:", error)
    return false
  }

  return data === true
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
