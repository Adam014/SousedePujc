// Shared Supabase .select() string constants to eliminate copy-paste

// Only public-safe user fields - never expose email, phone, address, is_admin
export const USER_PUBLIC_FIELDS = `id, name, avatar_url, is_verified, reputation_score, bio, created_at, last_active, last_seen`

export const ITEM_WITH_RELATIONS = `
  *,
  owner:users!items_owner_id_fkey(${USER_PUBLIC_FIELDS}),
  category:categories!items_category_id_fkey(*)
`

export const BOOKING_WITH_ITEM_OWNER_BORROWER = `
  *,
  item:items!bookings_item_id_fkey(
    *,
    owner:users!items_owner_id_fkey(${USER_PUBLIC_FIELDS})
  ),
  borrower:users!bookings_borrower_id_fkey(${USER_PUBLIC_FIELDS})
`

export const BOOKING_WITH_ITEM_BORROWER = `
  *,
  item:items!bookings_item_id_fkey(*),
  borrower:users!bookings_borrower_id_fkey(${USER_PUBLIC_FIELDS})
`

export const REVIEW_WITH_USERS = `
  *,
  reviewer:users!reviews_reviewer_id_fkey(${USER_PUBLIC_FIELDS}),
  reviewed:users!reviews_reviewed_id_fkey(${USER_PUBLIC_FIELDS})
`

export const CHAT_ROOM_WITH_RELATIONS = `
  *,
  item:items(*),
  owner:users!chat_rooms_owner_id_fkey(${USER_PUBLIC_FIELDS}),
  borrower:users!chat_rooms_borrower_id_fkey(${USER_PUBLIC_FIELDS})
`

export const MESSAGE_WITH_SENDER_REACTIONS = `
  *,
  sender:users(${USER_PUBLIC_FIELDS}),
  reactions:message_reactions(
    *,
    user:users(${USER_PUBLIC_FIELDS})
  )
`

export const REPLY_MESSAGE_FIELDS = `
  id,
  message,
  sender_id,
  created_at,
  sender:users(id, name, avatar_url)
`

export const REACTION_WITH_USER = `
  *,
  user:users(${USER_PUBLIC_FIELDS})
`
