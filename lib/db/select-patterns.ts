// Shared Supabase .select() string constants to eliminate copy-paste

export const ITEM_WITH_RELATIONS = `
  *,
  owner:users!items_owner_id_fkey(*),
  category:categories!items_category_id_fkey(*)
`

export const BOOKING_WITH_ITEM_OWNER_BORROWER = `
  *,
  item:items!bookings_item_id_fkey(
    *,
    owner:users!items_owner_id_fkey(*)
  ),
  borrower:users!bookings_borrower_id_fkey(*)
`

export const BOOKING_WITH_ITEM_BORROWER = `
  *,
  item:items!bookings_item_id_fkey(*),
  borrower:users!bookings_borrower_id_fkey(*)
`

export const REVIEW_WITH_USERS = `
  *,
  reviewer:users!reviews_reviewer_id_fkey(*),
  reviewed:users!reviews_reviewed_id_fkey(*)
`

export const CHAT_ROOM_WITH_RELATIONS = `
  *,
  item:items(*),
  owner:users!chat_rooms_owner_id_fkey(*),
  borrower:users!chat_rooms_borrower_id_fkey(*)
`

export const MESSAGE_WITH_SENDER_REACTIONS = `
  *,
  sender:users(*),
  reactions:message_reactions(
    *,
    user:users(*)
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
  user:users(*)
`
