import { format, differenceInDays } from "date-fns"
import { cs } from "date-fns/locale"
import { findApplicableDiscount } from "@/lib/constants"
import type { Booking } from "@/lib/types"

export interface BookedDate {
  date: Date
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface PricingResult {
  days: number
  basePrice: number
  discount: ReturnType<typeof findApplicableDiscount>
  discountAmount?: number
  finalPrice: number
}

export function getDaysInMonth(year: number, month: number): CalendarDay[] {
  const date = new Date(year, month, 1)
  const days: CalendarDay[] = []

  const firstDay = date.getDay() || 7
  for (let i = 1; i < firstDay; i++) {
    const prevDate = new Date(year, month, 1 - i)
    days.unshift({ date: prevDate, isCurrentMonth: false })
  }

  while (date.getMonth() === month) {
    days.push({ date: new Date(date), isCurrentMonth: true })
    date.setDate(date.getDate() + 1)
  }

  const lastDay = days[days.length - 1].date.getDay() || 7
  for (let i = 1; i <= 7 - lastDay; i++) {
    const nextDate = new Date(year, month + 1, i)
    days.push({ date: nextDate, isCurrentMonth: false })
  }

  return days
}

export function getMonths() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(new Date(2000, i, 1), "MMMM", { locale: cs }),
  }))
}

export function getYears() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString(),
  }))
}

export function expandBookingsToDates(bookings: Booking[]): BookedDate[] {
  const dates: BookedDate[] = []

  bookings.forEach((booking) => {
    if (booking.status === "cancelled") return

    const startParts = booking.start_date.split("-").map(Number)
    const endParts = booking.end_date.split("-").map(Number)

    const start = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0)
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2], 0, 0, 0, 0)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push({ date: new Date(d), status: booking.status })
    }
  })

  return dates
}

export function calculatePricing(selectedDates: DateRange, dailyRate: number): PricingResult {
  if (!selectedDates.from || !selectedDates.to) {
    return { days: 0, basePrice: 0, discount: null, finalPrice: 0 }
  }

  const days = differenceInDays(selectedDates.to, selectedDates.from) + 1
  const basePrice = days * dailyRate

  const discount = findApplicableDiscount(days)
  const discountAmount = discount ? (basePrice * discount.percentage) / 100 : 0
  const finalPrice = basePrice - discountAmount

  return { days, basePrice, discount, discountAmount, finalPrice }
}
