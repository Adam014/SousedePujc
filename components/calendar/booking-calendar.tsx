"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/database"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CalendarIcon, Info, Check, Percent } from "lucide-react"
import {
  format,
  isSameDay,
  isBefore,
  isAfter,
  isWithinInterval,
  addMonths,
  subMonths,
  differenceInDays,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { cs } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BookingCalendarProps {
  itemId: string
  selectedDates: {
    from: Date | undefined
    to: Date | undefined
  }
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void
  dailyRate?: number
  depositAmount?: number
}

interface BookedDate {
  date: Date
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
}

interface Discount {
  days: number
  percentage: number
  label: string
}

// Slevy pro delší rezervace
const DISCOUNTS: Discount[] = [
  { days: 7, percentage: 10, label: "Týden" },
  { days: 14, percentage: 15, label: "2 týdny" },
  { days: 30, percentage: 20, label: "Měsíc" },
]

// Pomocná funkce pro vytvoření pole dnů v měsíci
const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1)
  const days = []

  // Přidáme dny z předchozího měsíce pro doplnění prvního týdne
  const firstDay = date.getDay() || 7 // 0 = neděle, 1-6 = pondělí-sobota, převedeme 0 na 7
  for (let i = 1; i < firstDay; i++) {
    const prevDate = new Date(year, month, 1 - i)
    days.unshift({
      date: prevDate,
      isCurrentMonth: false,
    })
  }

  // Přidáme dny aktuálního měsíce
  while (date.getMonth() === month) {
    days.push({
      date: new Date(date),
      isCurrentMonth: true,
    })
    date.setDate(date.getDate() + 1)
  }

  // Přidáme dny z následujícího měsíce pro doplnění posledního týdne
  const lastDay = days[days.length - 1].date.getDay() || 7
  for (let i = 1; i <= 7 - lastDay; i++) {
    const nextDate = new Date(year, month + 1, i)
    days.push({
      date: nextDate,
      isCurrentMonth: false,
    })
  }

  return days
}

// Pomocná funkce pro generování seznamu měsíců
const getMonths = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(new Date(2000, i, 1), "MMMM", { locale: cs }),
  }))
}

// Pomocná funkce pro generování seznamu let
const getYears = () => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString(),
  }))
}

// Pomocná funkce pro nalezení aplikovatelné slevy
const findApplicableDiscount = (days: number): Discount | null => {
  // Seřadíme slevy od největší po nejmenší
  const sortedDiscounts = [...DISCOUNTS].sort((a, b) => b.days - a.days)

  // Najdeme první slevu, která je aplikovatelná
  return sortedDiscounts.find((discount) => days >= discount.days) || null
}

export default function BookingCalendar({
  itemId,
  selectedDates,
  onSelect,
  dailyRate = 0,
  depositAmount = 0,
}: BookingCalendarProps) {
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<{ date: Date; isCurrentMonth: boolean }[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [availableDaysInMonth, setAvailableDaysInMonth] = useState<number>(0)

  // Nastavení aktuálního měsíce a roku
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const today = new Date()

  // Aktualizace dnů v kalendáři při změně měsíce
  useEffect(() => {
    setCalendarDays(getDaysInMonth(currentYear, currentMonth))

    // Spočítáme dostupné dny v měsíci
    const start = startOfMonth(new Date(currentYear, currentMonth))
    const end = endOfMonth(new Date(currentYear, currentMonth))
    let availableDays = 0

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (!isDateDisabled(d)) {
        availableDays++
      }
    }

    setAvailableDaysInMonth(availableDays)
  }, [currentMonth, currentYear, bookedDates])

  // Načtení rezervovaných termínů
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

  // Funkce pro kontrolu, zda je datum rezervováno
  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) =>
        isSameDay(bookedDate.date, date) &&
        (bookedDate.status === "confirmed" || bookedDate.status === "active" || bookedDate.status === "completed"),
    )
  }

  // Funkce pro kontrolu, zda je datum čekající na potvrzení
  const isDatePending = (date: Date) => {
    return bookedDates.some((bookedDate) => isSameDay(bookedDate.date, date) && bookedDate.status === "pending")
  }

  // Funkce pro kontrolu, zda je datum zakázáno
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isBefore(date, today) || isDateBooked(date)
  }

  // Funkce pro kontrolu, zda je datum dnešní
  const isToday = (date: Date) => {
    return isSameDay(date, today)
  }

  // Funkce pro kontrolu, zda je datum vybráno
  const isDateSelected = (date: Date) => {
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
  }

  // Funkce pro kontrolu, zda je datum začátek nebo konec výběru
  const isDateRangeStart = (date: Date) => {
    return selectedDates.from && isSameDay(date, selectedDates.from)
  }

  const isDateRangeEnd = (date: Date) => {
    return selectedDates.to && isSameDay(date, selectedDates.to)
  }

  // Funkce pro kontrolu, zda je datum v rozsahu výběru
  const isDateInRange = (date: Date) => {
    if (!selectedDates.from || !selectedDates.to) return false
    return (
      isWithinInterval(date, { start: selectedDates.from, end: selectedDates.to }) &&
      !isSameDay(date, selectedDates.from) &&
      !isSameDay(date, selectedDates.to)
    )
  }

  // Funkce pro výběr data
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return

    if (!selectedDates.from || (selectedDates.from && selectedDates.to)) {
      // Začínáme nový výběr
      onSelect({ from: date, to: undefined })
    } else {
      // Máme již vybraný začátek, vybereme konec
      if (isBefore(date, selectedDates.from)) {
        onSelect({ from: date, to: selectedDates.from })
      } else {
        onSelect({ from: selectedDates.from, to: date })
      }
    }
  }

  // Funkce pro přechod na předchozí měsíc
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  // Funkce pro přechod na následující měsíc
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  // Funkce pro změnu měsíce
  const handleMonthChange = (month: string) => {
    setCurrentDate(new Date(currentYear, Number.parseInt(month), 1))
  }

  // Funkce pro změnu roku
  const handleYearChange = (year: string) => {
    setCurrentDate(new Date(Number.parseInt(year), currentMonth, 1))
  }

  // Funkce pro rychlý výběr přednastavených rozsahů
  const handleQuickSelect = (days: number) => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + days - 1)
    onSelect({ from, to })
  }

  // Výpočet celkové ceny a slevy
  const calculatePricing = () => {
    if (!selectedDates.from || !selectedDates.to) return { days: 0, basePrice: 0, discount: null, finalPrice: 0 }

    const days = differenceInDays(selectedDates.to, selectedDates.from) + 1
    const basePrice = days * dailyRate

    // Najdeme aplikovatelnou slevu
    const discount = findApplicableDiscount(days)

    // Vypočítáme finální cenu
    const discountAmount = discount ? (basePrice * discount.percentage) / 100 : 0
    const finalPrice = basePrice - discountAmount

    return { days, basePrice, discount, discountAmount, finalPrice }
  }

  // Výpočet ceny a slevy
  const pricing = calculatePricing()

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

  // Dny v týdnu
  const weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]

  return (
    <div>
      <Label className="text-base font-medium">Vyberte datum</Label>
      <div className="mt-2 border rounded-md p-4">
        {/* Hlavička kalendáře */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(new Date(currentYear, currentMonth), "MMMM yyyy", { locale: cs })}</span>
                {availableDaysInMonth > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {availableDaysInMonth} volných dní
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Měsíc</h4>
                  <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte měsíc" />
                    </SelectTrigger>
                    <SelectContent>
                      {getMonths().map((month) => (
                        <SelectItem
                          key={month.value}
                          value={month.value}
                          className={Number(month.value) === today.getMonth() ? "font-bold bg-blue-50" : ""}
                        >
                          {month.label}
                          {Number(month.value) === today.getMonth() && (
                            <span className="ml-2 text-blue-600">(aktuální)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Rok</h4>
                  <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte rok" />
                    </SelectTrigger>
                    <SelectContent>
                      {getYears().map((year) => (
                        <SelectItem
                          key={year.value}
                          value={year.value}
                          className={Number(year.value) === today.getFullYear() ? "font-bold bg-blue-50" : ""}
                        >
                          {year.label}
                          {Number(year.value) === today.getFullYear() && (
                            <span className="ml-2 text-blue-600">(aktuální)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button onClick={() => setShowDatePicker(false)}>Potvrdit</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dny v týdnu */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Dny v měsíci */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isBooked = isDateBooked(day.date)
            const isPending = isDatePending(day.date)
            const isDisabled = isDateDisabled(day.date)
            const isTodayDate = isToday(day.date)
            const isSelected = isDateSelected(day.date)
            const isRangeStart = isDateRangeStart(day.date)
            const isRangeEnd = isDateRangeEnd(day.date)
            const isInRange = isDateInRange(day.date)

            let className = "h-10 w-full flex items-center justify-center rounded-full text-sm"

            if (!day.isCurrentMonth) {
              className += " text-gray-300"
            } else if (isDisabled) {
              className += " text-gray-400 cursor-not-allowed"
            } else {
              className += " cursor-pointer hover:bg-gray-100"
            }

            if (isBooked) {
              className += " bg-red-100 text-red-800 line-through"
            } else if (isPending) {
              className += " bg-yellow-100 text-yellow-800"
            } else if (isTodayDate) {
              className += " bg-blue-100 text-blue-800 font-bold"
            }

            if (isRangeStart) {
              className += " bg-blue-500 text-white font-bold"
            } else if (isRangeEnd) {
              className += " bg-blue-500 text-white font-bold"
            } else if (isInRange) {
              className += " bg-blue-100 text-blue-800"
            }

            return (
              <div key={index} className={className} onClick={() => !isDisabled && handleDateClick(day.date)}>
                {format(day.date, "d")}
              </div>
            )
          })}
        </div>

        {/* Rychlý výběr */}
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Rychlý výběr:</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(1)}>
              1 den
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(2)}>
              2 dny
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(7)}>
              Týden
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(14)}>
              2 týdny
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect(30)}>
              Měsíc
            </Button>
          </div>
        </div>

        {/* Dostupné slevy */}
        {dailyRate > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Percent className="h-4 w-4 mr-1 text-green-600" />
              Dostupné slevy:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {DISCOUNTS.map((discount) => (
                <div key={discount.days} className="border rounded-md p-2 text-center bg-green-50">
                  <div className="text-sm font-medium text-green-700">{discount.label}</div>
                  <div className="text-lg font-bold text-green-600">-{discount.percentage}%</div>
                  <div className="text-xs text-green-600">od {discount.days} dní</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Souhrn rezervace */}
        {selectedDates.from && selectedDates.to && dailyRate > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Check className="h-4 w-4 mr-1 text-blue-600" />
              Souhrn rezervace:
            </h4>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Od:</span>
                <span className="text-sm font-medium">
                  {format(selectedDates.from, "d. MMMM yyyy", { locale: cs })}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Do:</span>
                <span className="text-sm font-medium">{format(selectedDates.to, "d. MMMM yyyy", { locale: cs })}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Počet dní:</span>
                <span className="text-sm font-medium">{pricing.days}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Cena za den:</span>
                <span className="text-sm font-medium">{dailyRate} Kč</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Základní cena:</span>
                <span className="text-sm font-medium">{pricing.basePrice} Kč</span>
              </div>

              {pricing.discount && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span className="text-sm">Sleva ({pricing.discount.percentage}%):</span>
                  <span className="text-sm font-medium">-{pricing.discountAmount} Kč</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-base font-medium">Celková cena:</span>
                <span className="text-base font-bold">{pricing.finalPrice} Kč</span>
              </div>

              {depositAmount > 0 && (
                <div className="flex justify-between mt-2 pt-2 border-t border-blue-200">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center">
                        <span className="text-sm">Kauce:</span>
                        <Info className="h-3 w-3 ml-1 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">
                          Kauce je vratná částka, kterou zaplatíte při převzetí předmětu a bude vám vrácena při jeho
                          vrácení v původním stavu.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm font-medium">{depositAmount} Kč</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
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

      {/* Tipy pro rezervaci */}
      <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-blue-700 mb-1">Tipy pro rezervaci:</h4>
          <ul className="text-xs text-blue-600 space-y-1 list-disc pl-4">
            <li>Vyberte první datum pro začátek rezervace a druhé datum pro konec.</li>
            <li>Červeně označené dny jsou již rezervované a nelze je vybrat.</li>
            <li>Žlutě označené dny mají čekající rezervace, které ještě nebyly potvrzeny.</li>
            <li>Pro rychlý výběr můžete použít přednastavené časové úseky.</li>
            {DISCOUNTS.length > 0 && <li>Při rezervaci na delší dobu získáte automatickou slevu.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
