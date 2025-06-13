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

export default function BookingCalendar({ itemId, selectedDates, onSelect }: BookingCalendarProps) {
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBookedDates = async () => {
      try {
        setLoading(true)
        setError(null)
        const bookings = await db.getBookingsForItem(itemId)
        const dates: Date[] = []

        bookings.forEach((booking) => {
          if (booking.status === "confirmed" || booking.status === "active") {
            const start = new Date(booking.start_date)
            const end = new Date(booking.end_date)

            // Zajistíme, že datum je správně nastaveno (bez časové složky)
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)

            // Přidáme všechny dny mezi začátkem a koncem rezervace
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              dates.push(new Date(d))
            }
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
        <style jsx global>{`
          .rdp-head_cell {
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
            text-align: center;
            padding: 0.5rem 0;
            width: 100%;
          }
          
          .rdp-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .rdp-cell {
            text-align: center;
            padding: 0;
            width: calc(100% / 7);
            height: 40px;
          }
          
          .rdp-day {
            width: 100%;
            height: 100%;
            border-radius: 0.375rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .rdp-day_selected {
            background-color: #3b82f6;
            color: white;
          }
          
          .rdp-day_range_middle {
            background-color: #dbeafe;
            color: #1e40af;
          }
          
          .rdp-day_disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
        <Calendar
          mode="range"
          selected={selectedDates}
          onSelect={(range) => onSelect(range || { from: undefined, to: undefined })}
          disabled={isDateDisabled}
          className={cn("rounded-md border p-3")}
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
          fromDate={new Date()}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
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
