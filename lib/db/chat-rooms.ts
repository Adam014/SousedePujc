import { supabase } from "../supabase"
import type { ChatRoom } from "../types"
import { assertValidUUID } from "./utils"
import { CHAT_ROOM_WITH_RELATIONS } from "./select-patterns"

export async function getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
  assertValidUUID(userId)
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(CHAT_ROOM_WITH_RELATIONS)
    .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching chat rooms:", error)
    throw error
  }

  return data || []
}

export async function getChatRoomById(roomId: string): Promise<ChatRoom | null> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(CHAT_ROOM_WITH_RELATIONS)
    .eq("id", roomId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching chat room:", error)
    throw error
  }

  return data
}

export async function createChatRoom(roomData: Omit<ChatRoom, "id" | "created_at" | "updated_at">): Promise<string> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .insert([roomData])
    .select("id")
    .single()

  if (error) {
    console.error("Error creating chat room:", error)
    throw error
  }

  return data.id
}
