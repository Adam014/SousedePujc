import { supabase } from "./supabase"
import type { User, Item, Category, Booking, Review, Notification } from "./types"

export const db = {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      throw error
    }

    return data || []
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      console.error("Error fetching user:", error)
      throw error
    }

    return data
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      console.error("Error fetching user by email:", error)
      return null
    }

    return data
  },

  async createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const { data, error } = await supabase.from("users").insert([userData]).select().single()

    if (error) {
      console.error("Error creating user:", error)
      throw error
    }

    return data
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString(),
    }

    // Pokud se aktualizuje avatar_url na null, explicitně to nastavíme
    if (userData.avatar_url === null) {
      updateData.avatar_url = null
    }

    // Pokud se aktualizuje privacy_settings, ujistíme se, že je to objekt
    if (userData.privacy_settings) {
      updateData.privacy_settings = userData.privacy_settings
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating user:", error)
      throw error
    }

    return data
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      throw error
    }

    return data || []
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching category:", error)
      throw error
    }

    return data
  },

  // Items
  async getItems(): Promise<Item[]> {
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
      console.error("Error fetching items:", error)
      throw error
    }

    return data || []
  },

  async getItemById(id: string): Promise<Item | null> {
    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        owner:users!items_owner_id_fkey(*),
        category:categories!items_category_id_fkey(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching item:", error)
      throw error
    }

    return data
  },

  async getItemsByOwner(ownerId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        owner:users!items_owner_id_fkey(*),
        category:categories!items_category_id_fkey(*)
      `)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching items by owner:", error)
      throw error
    }

    return data || []
  },

  async createItem(itemData: Omit<Item, "id" | "created_at" | "updated_at">): Promise<Item> {
    const { data, error } = await supabase
      .from("items")
      .insert([itemData])
      .select(`
        *,
        owner:users!items_owner_id_fkey(*),
        category:categories!items_category_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error creating item:", error)
      throw error
    }

    return data
  },

  async updateItem(id: string, itemData: Partial<Item>): Promise<Item | null> {
    const { data, error } = await supabase
      .from("items")
      .update({ ...itemData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        owner:users!items_owner_id_fkey(*),
        category:categories!items_category_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error updating item:", error)
      throw error
    }

    return data
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      throw error
    }

    return true
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        item:items!bookings_item_id_fkey(
          *,
          owner:users!items_owner_id_fkey(*)
        ),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings:", error)
      throw error
    }

    return data || []
  },

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    // Upravený dotaz pro správné načtení údajů o majiteli předmětu
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        item:items!bookings_item_id_fkey(
          *,
          owner:users!items_owner_id_fkey(*)
        ),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .eq("borrower_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings by user:", error)
      throw error
    }

    // Kontrola, že každá rezervace má správně načtené údaje o majiteli
    const bookingsWithOwners =
      data?.map((booking) => {
        if (!booking.item?.owner) {
          console.warn("Missing owner data for booking:", booking.id)
        }
        return booking
      }) || []

    return bookingsWithOwners
  },

  async getBookingsByOwner(ownerId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .eq("item.owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings by owner:", error)
      // Try alternative approach
      const { data: items } = await supabase.from("items").select("id").eq("owner_id", ownerId)

      if (!items) return []

      const itemIds = items.map((item) => item.id)

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          item:items!bookings_item_id_fkey(*),
          borrower:users!bookings_borrower_id_fkey(*)
        `)
        .in("item_id", itemIds)
        .order("created_at", { ascending: false })

      if (bookingsError) {
        console.error("Error fetching bookings by owner (alternative):", bookingsError)
        throw bookingsError
      }

      return bookings || []
    }

    return data || []
  },

  async getBookingsForItem(itemId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .eq("item_id", itemId)
      .neq("status", "cancelled")
      .order("start_date", { ascending: true })

    if (error) {
      console.error("Error fetching bookings for item:", error)
      throw error
    }

    return data || []
  },

  async getAllBookingsForItem(itemId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .eq("item_id", itemId)
      .order("start_date", { ascending: true })

    if (error) {
      console.error("Error fetching all bookings for item:", error)
      throw error
    }

    return data || []
  },

  async createBooking(bookingData: Omit<Booking, "id" | "created_at" | "updated_at">): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      throw error
    }

    return data
  },

  async updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | null> {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error updating booking status:", error)
      throw error
    }

    return data
  },

  async updateBookingWithReason(id: string, status: Booking["status"], reason?: string): Promise<Booking | null> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (reason) {
      updateData.message = reason
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error updating booking with reason:", error)
      throw error
    }

    return data
  },

  async deleteBooking(id: string): Promise<boolean> {
    const { error } = await supabase.from("bookings").delete().eq("id", id)

    if (error) {
      console.error("Error deleting booking:", error)
      throw error
    }

    return true
  },

  // Přidání nové funkce pro načtení rezervací předmětů, které vlastní uživatel
  async getBookingsForOwnedItems(itemIds: string[]): Promise<Booking[]> {
    if (itemIds.length === 0) return []

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        item:items!bookings_item_id_fkey(*),
        borrower:users!bookings_borrower_id_fkey(*)
      `)
      .in("item_id", itemIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings for owned items:", error)
      throw error
    }

    return data || []
  },

  // Reviews
  async getReviewsByUser(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(*),
        reviewed:users!reviews_reviewed_id_fkey(*)
      `)
      .eq("reviewed_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reviews by user:", error)
      throw error
    }

    return data || []
  },

  async createReview(reviewData: Omit<Review, "id" | "created_at">): Promise<Review> {
    const { data, error } = await supabase
      .from("reviews")
      .insert([reviewData])
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(*),
        reviewed:users!reviews_reviewed_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error creating review:", error)
      throw error
    }

    return data
  },

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
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
  },

  async createNotification(notificationData: Omit<Notification, "id" | "created_at">): Promise<Notification> {
    const { data, error } = await supabase.from("notifications").insert([notificationData]).select().single()

    if (error) {
      console.error("Error creating notification:", error)
      throw error
    }

    return data
  },

  async markNotificationAsRead(id: string): Promise<Notification | null> {
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
  },

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
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
  },
}
