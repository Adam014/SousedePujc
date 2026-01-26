// Item condition labels and colors (used across item-card.tsx and items/[id]/page.tsx)
export const CONDITION_LABELS = {
  excellent: "Vyborny",
  very_good: "Velmi dobry",
  good: "Dobry",
  fair: "Uspokojivry",
  poor: "Spatny",
} as const

export const CONDITION_LABELS_CZ = {
  excellent: "Výborný",
  very_good: "Velmi dobrý",
  good: "Dobrý",
  fair: "Uspokojivý",
  poor: "Špatný",
} as const

export const CONDITION_COLORS = {
  excellent: "bg-green-100 text-green-800",
  very_good: "bg-blue-100 text-blue-800",
  good: "bg-yellow-100 text-yellow-800",
  fair: "bg-orange-100 text-orange-800",
  poor: "bg-red-100 text-red-800",
} as const

// Booking status labels and colors
export const BOOKING_STATUS_LABELS = {
  pending: "Čeká na potvrzení",
  confirmed: "Potvrzeno",
  active: "Aktivní",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
} as const

// Alternative labels for booking request cards (owner perspective)
export const BOOKING_REQUEST_STATUS_LABELS = {
  pending: "Čeká na rozhodnutí",
  confirmed: "Potvrzeno",
  active: "Aktivní",
  completed: "Dokončeno",
  cancelled: "Zamítnuto",
} as const

export const BOOKING_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
} as const

// Discount configuration for longer rentals
export const RENTAL_DISCOUNTS = [
  { days: 7, percentage: 10, label: "Týden" },
  { days: 14, percentage: 15, label: "2 týdny" },
  { days: 30, percentage: 20, label: "Měsíc" },
] as const

// Helper function to find applicable discount
export const findApplicableDiscount = (days: number) => {
  // Sort discounts from highest to lowest
  const sortedDiscounts = [...RENTAL_DISCOUNTS].sort((a, b) => b.days - a.days)

  // Find the first applicable discount
  return sortedDiscounts.find((discount) => days >= discount.days) || null
}

// Type exports for TypeScript
export type ItemCondition = keyof typeof CONDITION_LABELS_CZ
export type BookingStatus = keyof typeof BOOKING_STATUS_LABELS
