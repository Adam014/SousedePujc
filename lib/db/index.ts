import * as users from "./users"
import * as categories from "./categories"
import * as items from "./items"
import * as bookings from "./bookings"
import * as reviews from "./reviews"
import * as notifications from "./notifications"
import * as chatRooms from "./chat-rooms"
import * as chatMessages from "./chat-messages"

export { invalidateCache } from "./cache"

export const db = {
  // Users
  getUsers: users.getUsers,
  getUserById: users.getUserById,
  getUserByEmail: users.getUserByEmail,
  createUser: users.createUser,
  updateUser: users.updateUser,
  updateUserLastSeen: users.updateUserLastSeen,

  // Categories
  getCategories: categories.getCategories,
  getCategoryById: categories.getCategoryById,

  // Items
  getItems: items.getItems,
  getItemById: items.getItemById,
  getItemsByOwner: items.getItemsByOwner,
  createItem: items.createItem,
  updateItem: items.updateItem,
  deleteItem: items.deleteItem,

  // Bookings
  getBookings: bookings.getBookings,
  getBookingById: bookings.getBookingById,
  getBookingsByUser: bookings.getBookingsByUser,
  getBookingsByOwner: bookings.getBookingsByOwner,
  getBookingsForItem: bookings.getBookingsForItem,
  getAllBookingsForItem: bookings.getAllBookingsForItem,
  createBooking: bookings.createBooking,
  updateBookingStatus: bookings.updateBookingStatus,
  updateBookingWithReason: bookings.updateBookingWithReason,
  deleteBooking: bookings.deleteBooking,
  getBookingsForOwnedItems: bookings.getBookingsForOwnedItems,

  // Reviews
  getReviewsByUser: reviews.getReviewsByUser,
  createReview: reviews.createReview,

  // Notifications
  getNotificationsByUser: notifications.getNotificationsByUser,
  createNotification: notifications.createNotification,
  markNotificationAsRead: notifications.markNotificationAsRead,
  markAllNotificationsAsRead: notifications.markAllNotificationsAsRead,

  // Chat Rooms
  getChatRoomsByUser: chatRooms.getChatRoomsByUser,
  getChatRoomById: chatRooms.getChatRoomById,
  createChatRoom: chatRooms.createChatRoom,

  // Chat Messages
  getChatMessagesByRoom: chatMessages.getChatMessagesByRoom,
  sendChatMessage: chatMessages.sendChatMessage,
  updateChatMessage: chatMessages.updateChatMessage,
  deleteChatMessage: chatMessages.deleteChatMessage,
  markChatMessagesAsRead: chatMessages.markChatMessagesAsRead,
  markAllChatRoomsAsRead: chatMessages.markAllChatRoomsAsRead,
  getUnreadMessageCount: chatMessages.getUnreadMessageCount,

  // Reactions
  addMessageReaction: chatMessages.addMessageReaction,
  removeMessageReaction: chatMessages.removeMessageReaction,
  getMessageReactions: chatMessages.getMessageReactions,
}
