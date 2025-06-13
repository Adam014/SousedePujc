"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/database"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingCalendarProps {
  itemId: string
  selectedDates: {
    from: Date | undefined
    to: Date | undefined
  }
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void
}

interface BookedDate {
  date: Date
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
}

export default function BookingCalendar({ itemId, selectedDates, onSelect }: BookingCalendarProps) {
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBookedDates = async () => {
      try {
        setLoading(true)
        setError(null)
        // Načteme všechny rezervace pro daný předmět, včetně čekajících
        const bookings = await db.getAllBookingsForItem(itemId)
        const dates: BookedDate[] = []

        bookings.forEach((booking) => {
          // Přeskočíme zrušené rezervace
          if (booking.status === "cancelled") return

          const start = new Date(booking.start_date)
          const end = new Date(booking.end_date)

          // Zajistíme, že datum je správně nastaveno (bez časové složky)
          start.setHours(0, 0, 0, 0)
          end.setHours(0, 0, 0, 0)

          // Přidáme všechny dny mezi začátkem a koncem rezervace
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push({
              date: new Date(d),
              status: booking.status,
            })
          }
        })

        setBookedDates(dates)
      } catch (error) {
        console.error("Error loading booked dates:", error)
        setError("Nepodařilo se načíst obsazené termíny")
      } finally {
        setLoading(false)
      }
    }

    loadBookedDates()
  }, [itemId])

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) =>
        bookedDate.date.getFullYear() === date.getFullYear() &&
        bookedDate.date.getMonth() === date.getMonth() &&
        bookedDate.date.getDate() === date.getDate() &&
        (bookedDate.status === "confirmed" || bookedDate.status === "active" || bookedDate.status === "completed"),
    )
  }

  const isDatePending = (date: Date) => {
    return bookedDates.some(
      (bookedDate) =>
        bookedDate.date.getFullYear() === date.getFullYear() &&
        bookedDate.date.getMonth() === date.getMonth() &&
        bookedDate.date.getDate() === date.getDate() &&
        bookedDate.status === "pending",
    )
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today || isDateBooked(date)
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Načítání kalendáře...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
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
          className={cn("rounded-md border")}
          modifiers={{
            booked: bookedDates
              .filter((d) => d.status === "confirmed" || d.status === "active" || d.status === "completed")
              .map((d) => d.date),
            pending: bookedDates.filter((d) => d.status === "pending").map((d) => d.date),
            today: [new Date()],
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              textDecoration: "line-through",
              fontWeight: "bold",
            },
            pending: {
              backgroundColor: "#fef3c7",
              color: "#92400e",
              fontWeight: "bold",
            },
            today: {
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              fontWeight: "bold",
              border: "2px solid #3b82f6",
            },
            selected: {
              backgroundColor: "#3b82f6",
              color: "white",
              fontWeight: "bold",
            },
            range_middle: {
              backgroundColor: "#bfdbfe",
              color: "#1e40af",
            },
          }}
          fromDate={new Date()}
          styles={{
            day_today: { backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: "bold" },
            day_selected: { backgroundColor: "#3b82f6", color: "white", fontWeight: "bold" },
            day_range_middle: { backgroundColor: "#bfdbfe", color: "#1e40af" },
          }}
        />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300"></div>
          <p className="text-sm text-gray-600">Potvrzené rezervace</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-300"></div>
          <p className="text-sm text-gray-600">Čekající rezervace</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300"></div>
          <p className="text-sm text-gray-600">Dnešní datum</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600"></div>
          <p className="text-sm text-gray-600">Vybraný termín</p>
        </div>
      </div>
    </div>
  )
}
