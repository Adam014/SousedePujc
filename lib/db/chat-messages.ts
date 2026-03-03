import { supabase } from "../supabase"
import type { ChatMessage, MessageReaction } from "../types"
import { filterInappropriateContent, logFilteredContent, type ContentFilterResult } from "../content-filter"
import { assertValidUUID } from "./utils"
import { MESSAGE_WITH_SENDER_REACTIONS, REPLY_MESSAGE_FIELDS, REACTION_WITH_USER } from "./select-patterns"
import { getUserById } from "./users"

export async function getChatMessagesByRoom(roomId: string): Promise<ChatMessage[]> {
  try {
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select(MESSAGE_WITH_SENDER_REACTIONS)
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Error fetching chat messages:", messagesError)
      throw messagesError
    }

    if (!messages || messages.length === 0) {
      return []
    }

    const replyToIds = messages
      .filter((msg) => msg.reply_to_id)
      .map((msg) => msg.reply_to_id)
      .filter((id, index, arr) => arr.indexOf(id) === index)

    let repliedMessages: any[] = []

    if (replyToIds.length > 0) {
      const { data: replies, error: repliesError } = await supabase
        .from("chat_messages")
        .select(REPLY_MESSAGE_FIELDS)
        .in("id", replyToIds)

      if (repliesError) {
        console.error("Error fetching replied messages:", repliesError)
      } else {
        repliedMessages = replies || []
      }
    }

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
}

export async function sendChatMessage(
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
    .select(MESSAGE_WITH_SENDER_REACTIONS)
    .single()

  if (error) {
    console.error("Error sending chat message:", error)
    throw error
  }

  if (filterResult.wasFiltered) {
    logFilteredContent(messageData.sender_id, filterResult.filteredWords, "chat_message", data.id)
  }

  await supabase
    .from("chat_rooms")
    .update({
      last_message: filteredMessageData.message,
      last_message_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", filteredMessageData.room_id)

  let messageWithReply = data
  if (data.reply_to_id) {
    const { data: repliedMessage } = await supabase
      .from("chat_messages")
      .select(REPLY_MESSAGE_FIELDS)
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
}

export async function updateChatMessage(
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
      .select(MESSAGE_WITH_SENDER_REACTIONS)
      .single()

    if (error) {
      console.error("Error updating chat message:", error)
      throw error
    }

    if (filterResult.wasFiltered) {
      logFilteredContent(existingMessage.sender_id, filterResult.filteredWords, "chat_message_edit", messageId)
    }

    let messageWithReply = data
    if (data.reply_to_id) {
      const { data: repliedMessage } = await supabase
        .from("chat_messages")
        .select(REPLY_MESSAGE_FIELDS)
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
}

export async function deleteChatMessage(messageId: string): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").delete().eq("id", messageId)

  if (error) {
    console.error("Error deleting chat message:", error)
    throw error
  }

  return true
}

export async function markChatMessagesAsRead(roomId: string, userId: string): Promise<boolean> {
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
}

export async function markAllChatRoomsAsRead(roomIds: string[], userId: string): Promise<boolean> {
  if (roomIds.length === 0) return true

  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .in("room_id", roomIds)
    .neq("sender_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error batch marking chat messages as read:", error)
    throw error
  }

  return true
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  assertValidUUID(userId)
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

  return count || 0
}

// Reactions
export async function addMessageReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
  try {
    const { data: existingReaction } = await supabase
      .from("message_reactions")
      .select("*")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle()

    if (existingReaction) {
      const user = await getUserById(userId)
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
      .select(REACTION_WITH_USER)
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
}

export async function removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
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
}

export async function getMessageReactions(messageId: string): Promise<MessageReaction[]> {
  try {
    const { data, error } = await supabase
      .from("message_reactions")
      .select(REACTION_WITH_USER)
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
}
