"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/database"

interface BookingCalendarProps {
  itemId: string
  selectedDates: {
    from: Date | undefined
    to: Date | undefined
  }
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export default function BookingCalendar({ itemId, selectedDates, onSelect }: BookingCalendarProps) {
  const [bookedDates, setBookedDates] = useState<Date[]>([])

  useEffect(() => {
    const loadBookedDates = async () => {
      try {
        const bookings = await db.getBookingsForItem(itemId)
        const dates: Date[] = []

        bookings.forEach((booking) => {
          if (booking.status === "confirmed" || booking.status === "active") {
            const start = new Date(booking.start_date)
            const end = new Date(booking.end_date)

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              dates.push(new Date(d))
            }
          }
        })

        setBookedDates(dates)
      } catch (error) {
        console.error("Error loading booked dates:", error)
      }
    }

    loadBookedDates()
  }, [itemId])

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) =>
        bookedDate.getFullYear() === date.getFullYear() &&
        bookedDate.getMonth() === date.getMonth() &&
        bookedDate.getDate() === date.getDate(),
    )
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today || isDateBooked(date)
  }

  return (
    <div>
      <Label className="text-base font-medium">Vyberte datum</Label>
      <div className="mt-2">
        <Calendar
          mode="range"
          selected={selectedDates}
          onSelect={(range) => onSelect(range || { from: undefined, to: undefined })}
          disabled={isDateDisabled}
          className="rounded-md border"
          modifiers={{
            booked: bookedDates,
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              textDecoration: "line-through",
            },
          }}
        />
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <p>• Červené dny jsou již rezervované</p>
        <p>• Vyberte dostupné dny pro vaši rezervaci</p>
      </div>
    </div>
  )
}
