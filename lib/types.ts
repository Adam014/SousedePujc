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
