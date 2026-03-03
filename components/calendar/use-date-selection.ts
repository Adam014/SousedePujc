import { useCallback } from "react"
import { isSameDay, isBefore, isAfter, isWithinInterval } from "date-fns"
import type { BookedDate, DateRange } from "./booking-calendar.utils"

interface UseDateSelectionParams {
  bookedDates: BookedDate[]
  selectedDates: DateRange
  onSelect: (range: DateRange) => void
}

export function useDateSelection({ bookedDates, selectedDates, onSelect }: UseDateSelectionParams) {
  const isDateBooked = useCallback((date: Date) => {
    return bookedDates.some(
      (bookedDate) =>
        isSameDay(bookedDate.date, date) &&
        (bookedDate.status === "confirmed" || bookedDate.status === "active" || bookedDate.status === "completed"),
    )
  }, [bookedDates])

  const isDatePending = useCallback((date: Date) => {
    return bookedDates.some((bookedDate) => isSameDay(bookedDate.date, date) && bookedDate.status === "pending")
  }, [bookedDates])

  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isBefore(date, today) || isDateBooked(date) || isDatePending(date)
  }, [isDateBooked, isDatePending])

  const isToday = useCallback((date: Date) => {
    return isSameDay(date, new Date())
  }, [])

  const isDateSelected = useCallback((date: Date) => {
    if (!selectedDates.from && !selectedDates.to) return false

    if (selectedDates.from && !selectedDates.to) {
      return isSameDay(date, selectedDates.from)
    }

    if (selectedDates.from && selectedDates.to) {
      return (
        isSameDay(date, selectedDates.from) ||
        isSameDay(date, selectedDates.to) ||
        (isAfter(date, selectedDates.from) && isBefore(date, selectedDates.to))
      )
    }

    return false
  }, [selectedDates])

  const isDateRangeStart = useCallback((date: Date) => {
    return selectedDates.from ? isSameDay(date, selectedDates.from) : false
  }, [selectedDates.from])

  const isDateRangeEnd = useCallback((date: Date) => {
    return selectedDates.to ? isSameDay(date, selectedDates.to) : false
  }, [selectedDates.to])

  const isDateInRange = useCallback((date: Date) => {
    if (!selectedDates.from || !selectedDates.to) return false
    return (
      isWithinInterval(date, { start: selectedDates.from, end: selectedDates.to }) &&
      !isSameDay(date, selectedDates.from) &&
      !isSameDay(date, selectedDates.to)
    )
  }, [selectedDates])

  const isRangeAvailable = useCallback((from: Date, to: Date) => {
    const start = isBefore(from, to) ? from : to
    const end = isAfter(from, to) ? from : to

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (isDateBooked(d) || isDatePending(d)) {
        return false
      }
    }
    return true
  }, [isDateBooked, isDatePending])

  const handleDateClick = useCallback((date: Date) => {
    if (isDateDisabled(date)) return

    if (!selectedDates.from || (selectedDates.from && selectedDates.to)) {
      onSelect({ from: date, to: undefined })
    } else {
      const newFrom = isBefore(date, selectedDates.from) ? date : selectedDates.from
      const newTo = isBefore(date, selectedDates.from) ? selectedDates.from : date

      if (!isRangeAvailable(newFrom, newTo)) {
        onSelect({ from: date, to: undefined })
        return
      }

      onSelect({ from: newFrom, to: newTo })
    }
  }, [selectedDates, onSelect, isDateDisabled, isRangeAvailable])

  const handleQuickSelect = useCallback((days: number) => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + days - 1)

    if (!isRangeAvailable(from, to)) {
      const startDate = new Date(from)
      let found = false

      for (let i = 0; i < 90 && !found; i++) {
        const checkFrom = new Date(startDate)
        checkFrom.setDate(checkFrom.getDate() + i)
        const checkTo = new Date(checkFrom)
        checkTo.setDate(checkTo.getDate() + days - 1)

        if (isRangeAvailable(checkFrom, checkTo)) {
          onSelect({ from: checkFrom, to: checkTo })
          found = true
        }
      }

      if (!found) {
        for (let i = 0; i < 90; i++) {
          const checkDate = new Date(from)
          checkDate.setDate(checkDate.getDate() + i)
          if (!isDateDisabled(checkDate)) {
            onSelect({ from: checkDate, to: undefined })
            break
          }
        }
      }
    } else {
      onSelect({ from, to })
    }
  }, [onSelect, isRangeAvailable, isDateDisabled])

  return {
    isDateBooked,
    isDatePending,
    isDateDisabled,
    isToday,
    isDateSelected,
    isDateRangeStart,
    isDateRangeEnd,
    isDateInRange,
    isRangeAvailable,
    handleDateClick,
    handleQuickSelect,
  }
}
