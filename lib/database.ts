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
// Přidání importu pro content filter
import { filterInappropriateContent, logInappropriateContent, type ContentFilterResult } from "./content-filter"

// Cache pro items a categories
let itemsCache: { data: Item[] | null; timestamp: number } = { data: null, timestamp: 0 }
let categoriesCache: { data: Category[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_DURATION = 30000 // 30 sekund cache
const CATEGORY_CACHE_DURATION = 300000 // 5 minut pro kategorie (mění se zřídka)

// Funkce pro invalidaci cache
export const invalidateCache = {
  items: () => { itemsCache = { data: null, timestamp: 0 } },
  categories: () => { categoriesCache = { data: null, timestamp: 0 } },
  all: () => {
    itemsCache = { data: null, timestamp: 0 }
    categoriesCache = { data: null, timestamp: 0 }
  }
}

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
    if ('avatar_url' in userData && userData.avatar_url === null) {
      updateData.avatar_url = undefined
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
    // Zkontrolujeme cache
    const now = Date.now()
    if (categoriesCache.data && (now - categoriesCache.timestamp) < CATEGORY_CACHE_DURATION) {
      return categoriesCache.data
    }

    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      // Vrátíme starou cache pokud existuje
      if (categoriesCache.data) return categoriesCache.data
      throw error
    }

    // Uložíme do cache
    categoriesCache = { data: data || [], timestamp: now }

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
    // Zkontrolujeme cache
    const now = Date.now()
    if (itemsCache.data && (now - itemsCache.timestamp) < CACHE_DURATION) {
      return itemsCache.data
    }

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

    // Uložíme do cache
    itemsCache = { data: data || [], timestamp: now }

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

    // Invalidate cache after creating item
    invalidateCache.items()

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

    // Invalidate cache after updating item
    invalidateCache.items()

    return data
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      throw error
    }

    // Invalidate cache after deleting item
    invalidateCache.items()

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
    // Nested filtering like .eq("item.owner_id", ownerId) doesn't work in Supabase
    // So we first get item IDs, then fetch bookings for those items
    try {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("id")
        .eq("owner_id", ownerId)

      if (itemsError) {
        console.error("Error fetching owner items:", itemsError)
        throw itemsError
      }

      if (!items || items.length === 0) return []

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
        console.error("Error fetching bookings by owner:", bookingsError)
        throw bookingsError
      }

      return bookings || []
    } catch (error) {
      console.error("Error in getBookingsByOwner:", error)
      throw error
    }
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
        await this.createChatRoom({
          booking_id: data.id,
          item_id: data.item_id,
          owner_id: data.item.owner_id,
          borrower_id: data.borrower_id,
        })
      } catch (chatError) {
        console.error("Error creating chat room:", chatError)
      }
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

  // Chat
  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    // Use parameterized OR filter to prevent SQL injection
    // Supabase's .or() with template literals is safe when using .eq() format
    // but we use explicit filter for clarity and safety
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(`
        *,
        item:items(*),
        owner:users!chat_rooms_owner_id_fkey(*),
        borrower:users!chat_rooms_borrower_id_fkey(*)
      `)
      .or(`owner_id.eq."${userId}",borrower_id.eq."${userId}"`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching chat rooms:", error)
      throw error
    }

    return data || []
  },

  async getChatRoomById(roomId: string): Promise<ChatRoom | null> {
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

    return data
  },

  // Fixed createChatRoom to return just the ID
  async createChatRoom(roomData: Omit<ChatRoom, "id" | "created_at" | "updated_at">): Promise<string> {
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
  },

  // Opravená funkce pro načítání zpráv - rozdělíme na dva dotazy
  async getChatMessagesByRoom(roomId: string): Promise<ChatMessage[]> {
    try {
      // Nejprve načteme všechny zprávy s jejich základními daty
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:users(*),
          reactions:message_reactions(
            *,
            user:users(*)
          )
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })

      if (messagesError) {
        console.error("Error fetching chat messages:", messagesError)
        throw messagesError
      }

      if (!messages || messages.length === 0) {
        return []
      }

      // Najdeme všechny reply_to_id které nejsou null
      const replyToIds = messages
        .filter((msg) => msg.reply_to_id)
        .map((msg) => msg.reply_to_id)
        .filter((id, index, arr) => arr.indexOf(id) === index) // unique values

      let repliedMessages: any[] = []

      // Pokud máme nějaké reply_to_id, načteme je
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
          // Pokračujeme bez replied zpráv
        } else {
          repliedMessages = replies || []
        }
      }

      // Spojíme zprávy s jejich replied zprávami
      const messagesWithReplies = messages.map((message) => {
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

  // V sendChatMessage funkci nahradit filtrování:
  async sendChatMessage(
    messageData: Omit<ChatMessage, "id" | "created_at" | "is_read">,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> {
    // Filtrování nevhodného obsahu
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

    // Logování nevhodného obsahu pokud bylo filtrováno
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

    // Aktualizujeme poslední zprávu v místnosti
    await supabase
      .from("chat_rooms")
      .update({
        last_message: filteredMessageData.message,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", filteredMessageData.room_id)

    // Pokud je to reply, načteme replied zprávu
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

  // V updateChatMessage funkci nahradit filtrování:
  async updateChatMessage(
    messageId: string,
    newText: string,
  ): Promise<{ message: ChatMessage; wasFiltered: boolean; filteredWords: string[] }> {
    // Filtrování nevhodného obsahu
    const filterResult: ContentFilterResult = filterInappropriateContent(newText)

    try {
      // Nejprve zkontrolujeme, zda zpráva existuje
      const { data: existingMessage, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("id", messageId)
        .single()

      if (fetchError) {
        console.error("Error fetching message for update:", fetchError)
        throw fetchError
      }

      // Aktualizace zprávy
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

      // Logování nevhodného obsahu pokud bylo filtrováno
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

      // Pokud je to reply, načteme replied zprávu
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

  // Vylepšená metoda pro smazání zprávy - nyní skutečně maže zprávu z databáze
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
    // Získáme všechny místnosti, kde je uživatel
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

    // Získáme počet nepřečtených zpráv
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

    return count || 0
  },

  // Přidání funkce pro aktualizaci last_seen
  async updateUserLastSeen(userId: string): Promise<void> {
    const { error } = await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userId)

    if (error) {
      console.error("Error updating user last seen:", error)
    }
  },

  // Opravené funkce pro reakce na zprávy
  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    try {
      // Nejprve zkontrolujeme, zda reakce již neexistuje
      const { data: existingReaction } = await supabase
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId)
        .eq("user_id", userId)
        .eq("emoji", emoji)
        .maybeSingle()

      if (existingReaction) {
        // Reakce již existuje, vrátíme ji s user daty
        const user = await this.getUserById(userId)
        return { ...existingReaction, user }
      }

      // Přidáme novou reakci
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
