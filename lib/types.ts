export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  avatar_url?: string
  is_verified: boolean
  is_admin: boolean
  reputation_score: number
  bio?: string
  created_at: string
  updated_at: string
  last_seen?: string
  privacy_settings?: {
    show_email: boolean
    show_phone: boolean
    show_address: boolean
    show_bio: boolean
  }
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
}

export interface Item {
  id: string
  owner_id: string
  category_id: string
  title: string
  description?: string
  condition: "excellent" | "very_good" | "good" | "fair" | "poor"
  daily_rate: number
  deposit_amount: number
  is_available: boolean
  location?: string
  images: string[]
  created_at: string
  updated_at: string
  owner?: User
  category?: Category
}

export interface Booking {
  id: string
  item_id: string
  borrower_id: string
  start_date: string
  end_date: string
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
  total_amount: number
  message?: string
  created_at: string
  updated_at: string
  item?: Item
  borrower?: User
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment?: string
  review_type: "borrower" | "lender"
  created_at: string
  reviewer?: User
  reviewed?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

// Nové typy pro chat
export interface ChatRoom {
  id: string
  booking_id: string
  item_id: string
  owner_id: string
  borrower_id: string
  last_message?: string
  last_message_time?: string
  created_at: string
  updated_at: string
  item?: Item
  owner?: User
  borrower?: User
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  message: string
  is_read: boolean
  is_edited?: boolean
  reply_to_id?: string
  attachment_url?: string
  attachment_name?: string
  attachment_type?: string
  reactions?: MessageReaction[]
  created_at: string
  updated_at?: string
  sender?: User
  reply_to?: ChatMessage
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: User
}

export interface TypingIndicator {
  room_id: string
  user_id: string
  user_name: string
  timestamp: number
}
