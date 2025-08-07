import { supabase } from "./supabase"
import type {
  User,
  Item,
  Category,
  Booking,
  Review,
  Notification,
  ChatRoom,
  ChatMessage,
  MessageReaction,
} from "./types"
import { filterInappropriateContent, logInappropriateContent, type ContentFilterResult } from "./content-filter"

// Cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export const db = {
  // Users
  async getUsers(): Promise<User[]> {
    const cacheKey = "users"
    const cached = getCachedData<User[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      throw error
    }

    const result = data || []
    setCachedData(cacheKey, result)
    return result
  },

  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `user-${id}`
    const cached = getCachedData<User>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching user:", error)
      throw error
    }

    setCachedData(cacheKey, data)
    return data
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching user by email:", error)
      return null
    }

    return data
  },

  async createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      throw error
    }

    // Invalidate users cache
    cache.delete("users")
    return data
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString(),
    }

    if (userData.avatar_url === null) {
      updateData.avatar_url = null
    }

    if (userData.privacy_settings) {
      updateData.privacy_settings = userData.privacy_settings
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      throw error
    }

    // Invalidate cache
    cache.delete(`user-${id}`)
    cache.delete("users")
    return data
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const cacheKey = "categories"
    const cached = getCachedData<Category[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      throw error
    }

    const result = data || []
    setCachedData(cacheKey, result)
    return result
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const cacheKey = `category-${id}`
    const cached = getCachedData<Category>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching category:", error)
      throw error
    }

    setCachedData(cacheKey, data)
    return data
  },

  // Items - Optimized with better indexing
  async getItems(): Promise<Item[]> {
    const cacheKey = "items"
    const cached = getCachedData<Item[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("items")
      .select(`
        id,
        title,
        description,
        images,
        daily_rate,
        condition,
        location,
        is_available,
        created_at,
        category_id,
        owner_id,
        owner:users!items_owner_id_fkey(id, name, avatar_url, reputation_score),
        category:categories!items_category_id_fkey(id, name)
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(1000) // Limit for performance

    if (error) {
      console.error("Error fetching items:", error)
      throw error
    }

    const result = data || []
    setCachedData(cacheKey, result)
    return result
  },

  async getItemById(id: string): Promise<Item | null> {
    const cacheKey = `item-${id}`
    const cached = getCachedData<Item>(cacheKey)
    if (cached) return cached

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

    setCachedData(cacheKey, data)
    return data
  },

  async getItemsByOwner(ownerId: string): Promise<Item[]> {
    const cacheKey = `items-owner-${ownerId}`
    const cached = getCachedData<Item[]>(cacheKey)
    if (cached) return cached

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

    const result = data || []
    setCachedData(cacheKey, result)
    return result
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

    // Invalidate cache
    cache.delete("items")
    cache.delete(`items-owner-${itemData.owner_id}`)
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

    // Invalidate cache
    cache.delete("items")
    cache.delete(`item-${id}`)
    if (data.owner_id) {
      cache.delete(`items-owner-${data.owner_id}`)
    }
    return data
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      throw error
    }

    // Invalidate cache
    cache.delete("items")
    cache.delete(`item-${id}`)
    return true
  },

  // Bookings - Optimized queries
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
      .limit(500) // Limit for performance

    if (error) {
      console.error("Error fetching bookings:", error)
      throw error
    }

    return data || []
  },

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    const cacheKey = `bookings-user-${userId}`
    const cached = getCachedData<Booking[]>(cacheKey)
    if (cached) return cached

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

    const bookingsWithOwners =
      data?.map((booking) => {
        if (!booking.item?.owner) {
          console.warn("Missing owner data for booking:", booking.id)
        }
        return booking
      }) || []

    setCachedData(cacheKey, bookingsWithOwners)
    return bookingsWithOwners
  },

  async getBookingsByOwner(ownerId: string): Promise<Booking[]> {
    const cacheKey = `bookings-owner-${ownerId}`
    const cached = getCachedData<Booking[]>(cacheKey)
    if (cached) return cached

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

      const result = bookings || []
      setCachedData(cacheKey, result)
      return result
    }

    const result = data || []
    setCachedData(cacheKey, result)
    return result
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

    // Po vytvoření rezervace vytvoříme chatovací místnost
    if (data && data.item) {
      try {
        // Check if chat room already exists for this item and users
        const existingRoom = await this.findExistingChatRoom(data.item_id, data.item.owner_id, data.borrower_id)
        
        if (!existingRoom) {
          await this.createChatRoom({
            booking_id: data.id, // Now we have the booking ID
            item_id: data.item_id,
            owner_id: data.item.owner_id,
            borrower_id: data.borrower_id,
          })
        } else {
          // Update existing room with booking_id if it doesn't have one
          if (!existingRoom.booking_id) {
            await supabase
              .from("chat_rooms")
              .update({ booking_id: data.id })
              .eq("id", existingRoom.id)
          }
        }
      } catch (chatError) {
        console.error("Error creating chat room:", chatError)
        // Don't fail the booking creation if chat room creation fails
      }
    }

    // Invalidate cache
    cache.delete(`bookings-user-${bookingData.borrower_id}`)
    if (data.item?.owner_id) {
      cache.delete(`bookings-owner-${data.item.owner_id}`)
    }

    return data
  },

  // Helper function to find existing chat room
  async findExistingChatRoom(itemId: string, ownerId: string, borrowerId: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("item_id", itemId)
      .eq("owner_id", ownerId)
      .eq("borrower_id", borrowerId)
      .maybeSingle()

    if (error) {
      console.error("Error finding existing chat room:", error)
      return null
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

    // Invalidate cache
    if (data) {
      cache.delete(`bookings-user-${data.borrower_id}`)
      if (data.item?.owner_id) {
        cache.delete(`bookings-owner-${data.item.owner_id}`)
      }
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

    // Invalidate cache
    if (data) {
      cache.delete(`bookings-user-${data.borrower_id}`)
      if (data.item?.owner_id) {
        cache.delete(`bookings-owner-${data.item.owner_id}`)
      }
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
    const cacheKey = `reviews-${userId}`
    const cached = getCachedData<Review[]>(cacheKey)
    if (cached) return cached

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

    const result = data || []
    setCachedData(cacheKey, result)
    return result
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

    // Invalidate cache
    cache.delete(`reviews-${reviewData.reviewed_id}`)
    return data
  },

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50) // Limit for performance

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

  // Chat - Optimized for performance
  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const cacheKey = `chat-rooms-${userId}`
    const cached = getCachedData<ChatRoom[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("chat_rooms")
      .select(`
        *,
        item:items(*),
        owner:users!chat_rooms_owner_id_fkey(*),
        borrower:users!chat_rooms_borrower_id_fkey(*)
      `)
      .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching chat rooms:", error)
      throw error
    }

    const result = data || []
    setCachedData(cacheKey, result)
    return result
  },

  async getChatRoomById(roomId: string): Promise<ChatRoom | null> {
    const cacheKey = `chat-room-${roomId}`
    const cached = getCachedData<ChatRoom>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
      .from("chat_rooms")
      .select(`
        *,
        item:items(*),
        owner:users!chat_rooms_owner_id_fkey(*),
        borrower:users!chat_rooms_borrower_id_fkey(*)
      `)
      .eq("id", roomId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching chat room:", error)
      throw error
    }

    setCachedData(cacheKey, data)
    return data
  },

  async createChatRoom(roomData: Omit<ChatRoom, "id" | "created_at" | "updated_at">): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert([roomData])
      .select(`
        *,
        item:items(*),
        owner:users!chat_rooms_owner_id_fkey(*),
        borrower:users!chat_rooms_borrower_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("Error creating chat room:", error)
      throw error
    }

    // Invalidate cache
    cache.delete(`chat-rooms-${roomData.owner_id}`)
    cache.delete(`chat-rooms-${roomData.borrower_id}`)
    return data
  },

  // Optimized message loading with pagination
  async getChatMessagesByRoom(roomId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:users(id, name, avatar_url),
          reactions:message_reactions(
            *,
            user:users(id, name, avatar_url)
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (messagesError) {
        console.error("Error fetching chat messages:", messagesError)
        throw messagesError
      }

      if (!messages || messages.length === 0) {
        return []
      }

      // Reverse to get chronological order
      const reversedMessages = messages.reverse()

      // Find unique reply_to_id values
      const replyToIds = [...new Set(
        reversedMessages
          .filter((msg) => msg.reply_to_id)
          .map((msg) => msg.reply_to_id)
      )]

      let repliedMessages: any[] = []

      if (replyToIds.length > 0) {
        const { data: replies, error: repliesError } = await supabase
          .from("chat_messages")
          .select(`
            id,
            message,
            sender_id,
            created_at,
            sender:users(id, name, avatar_url)
          `)
          .in("id", replyToIds)

        if (repliesError) {
          console.error("Error fetching replied messages:", repliesError)
        } else {
          repliedMessages = replies || []
        }
      }

      // Combine messages with their replies
      const messagesWithReplies = reversedMessages.map((message) => {
        if (message.reply_to_id) {
          const repliedMessage = repliedMessages.find((reply) => reply.id === message.reply_to_id)
          return {
            ...message,
            reply_to: repliedMessage || null,
          }
        }
        return message
      })

      return messagesWithReplies
    } catch (error) {
      console.error("Error in getChatMessagesByRoom:", error)
      throw error
    }
  },

  async sendChatMessage(
    messageData: Omit<ChatMessage, "id" | "created_at" | "is_read">,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> {
    const filterResult: ContentFilterResult = filterInappropriateContent(messageData.message)

    const filteredMessageData = {
      ...messageData,
      message: filterResult.filteredText,
      is_read: false,
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([filteredMessageData])
      .select(`
        *,
        sender:users(*),
        reactions:message_reactions(
          *,
          user:users(*)
        )
      `)
      .single()

    if (error) {
      console.error("Error sending chat message:", error)
      throw error
    }

    if (filterResult.wasFiltered) {
      await logInappropriateContent(
        messageData.sender_id,
        filterResult.originalText,
        filterResult.filteredText,
        filterResult.filteredWords,
        "chat_message",
        data.id,
      )
    }

    // Update room's last message
    await supabase
      .from("chat_rooms")
      .update({
        last_message: filteredMessageData.message,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", filteredMessageData.room_id)

    // Invalidate cache
    cache.delete(`chat-room-${filteredMessageData.room_id}`)

    let messageWithReply = data
    if (data.reply_to_id) {
      const { data: repliedMessage } = await supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          sender_id,
          created_at,
          sender:users(id, name, avatar_url)
        `)
        .eq("id", data.reply_to_id)
        .single()

      messageWithReply = {
        ...data,
        reply_to: repliedMessage || null,
      }
    }

    return {
      message: messageWithReply,
      wasFiltered: filterResult.wasFiltered,
      filteredWords: filterResult.filteredWords,
    }
  },

  async updateChatMessage(
    messageId: string,
    newText: string,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> {
    const filterResult: ContentFilterResult = filterInappropriateContent(newText)

    try {
      const { data: existingMessage, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("id", messageId)
        .single()

      if (fetchError) {
        console.error("Error fetching message for update:", fetchError)
        throw fetchError
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .update({
          message: filterResult.filteredText,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .select(`
          *,
          sender:users(*),
          reactions:message_reactions(
            *,
            user:users(*)
          )
        `)
        .single()

      if (error) {
        console.error("Error updating chat message:", error)
        throw error
      }

      if (filterResult.wasFiltered) {
        await logInappropriateContent(
          existingMessage.sender_id,
          filterResult.originalText,
          filterResult.filteredText,
          filterResult.filteredWords,
          "chat_message_edit",
          messageId,
        )
      }

      let messageWithReply = data
      if (data.reply_to_id) {
        const { data: repliedMessage } = await supabase
          .from("chat_messages")
          .select(`
            id,
            message,
            sender_id,
            created_at,
            sender:users(id, name, avatar_url)
          `)
          .eq("id", data.reply_to_id)
          .single()

        messageWithReply = {
          ...data,
          reply_to: repliedMessage || null,
        }
      }

      return {
        message: messageWithReply,
        wasFiltered: filterResult.wasFiltered,
        filteredWords: filterResult.filteredWords,
      }
    } catch (error) {
      console.error("Error in updateChatMessage:", error)
      throw error
    }
  },

  async deleteChatMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId)

    if (error) {
      console.error("Error deleting chat message:", error)
      throw error
    }

    return true
  },

  async markChatMessagesAsRead(roomId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", roomId)
      .neq("sender_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking chat messages as read:", error)
      throw error
    }

    return true
  },

  async getUnreadMessageCount(userId: string): Promise<number> {
    const cacheKey = `unread-count-${userId}`
    const cached = getCachedData<number>(cacheKey)
    if (cached !== null) return cached

    const { data: rooms, error: roomsError } = await supabase
      .from("chat_rooms")
      .select("id")
      .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)

    if (roomsError) {
      console.error("Error fetching chat rooms for unread count:", roomsError)
      throw roomsError
    }

    if (!rooms || rooms.length === 0) return 0

    const roomIds = rooms.map((room) => room.id)

    const { count, error } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .in("room_id", roomIds)
      .neq("sender_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error counting unread messages:", error)
      throw error
    }

    const result = count || 0
    setCachedData(cacheKey, result)
    return result
  },

  async updateUserLastSeen(userId: string): Promise<void> {
    const { error } = await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userId)

    if (error) {
      console.error("Error updating user last seen:", error)
    }

    // Invalidate cache
    cache.delete(`user-${userId}`)
  },

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    try {
      const { data: existingReaction } = await supabase
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId)
        .eq("user_id", userId)
        .eq("emoji", emoji)
        .maybeSingle()

      if (existingReaction) {
        const user = await this.getUserById(userId)
        return { ...existingReaction, user }
      }

      const { data, error } = await supabase
        .from("message_reactions")
        .insert([
          {
            message_id: messageId,
            user_id: userId,
            emoji: emoji,
          },
        ])
        .select(`
          *,
          user:users(*)
        `)
        .single()

      if (error) {
        console.error("Error adding message reaction:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in addMessageReaction:", error)
      throw error
    }
  },

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId)
        .eq("emoji", emoji)

      if (error) {
        console.error("Error removing message reaction:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error in removeMessageReaction:", error)
      throw error
    }
  },

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select(`
          *,
          user:users(*)
        `)
        .eq("message_id", messageId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching message reactions:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getMessageReactions:", error)
      return []
    }
  },
}
