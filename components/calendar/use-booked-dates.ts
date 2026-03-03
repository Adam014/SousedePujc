import { useState, useEffect } from "react"
import { db } from "@/lib/database"
import { expandBookingsToDates, type BookedDate } from "./booking-calendar.utils"

export function useBookedDates(itemId: string) {
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBookedDates = async () => {
      try {
        setLoading(true)
        setError(null)
        const bookings = await db.getAllBookingsForItem(itemId)
        setBookedDates(expandBookingsToDates(bookings))
      } catch (error) {
        console.error("Error loading booked dates:", error)
        setError("Nepodařilo se načíst obsazené termíny")
      } finally {
        setLoading(false)
      }
    }

    loadBookedDates()
  }, [itemId])

  return { bookedDates, loading, error }
}
