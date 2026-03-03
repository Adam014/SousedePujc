import { supabase } from "../supabase"
import type { Notification } from "../types"

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }

  return data || []
}

export async function createNotification(notificationData: Omit<Notification, "id" | "created_at">): Promise<void> {
  const { error } = await supabase.from("notifications").insert([notificationData])

  if (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function markNotificationAsRead(id: string): Promise<Notification | null> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }

  return data
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }

  return true
}
