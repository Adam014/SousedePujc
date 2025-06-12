"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Mail, MessageSquare, Check, X, Calendar, MapPin } from "lucide-react"
import type { Booking } from "@/lib/types"
import { db } from "@/lib/database"

interface BookingCardProps {
  booking: Booking
  isOwner: boolean
}

const statusLabels = {
  pending: "Čeká na potvrzení",
  confirmed: "Potvrzeno",
  active: "Aktivní",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function BookingCard({ booking, isOwner }: BookingCardProps) {
  const otherUser = isOwner ? booking.borrower : booking.item?.owner

  const handleConfirmBooking = async () => {
    try {
      await db.updateBookingStatus(booking.id, "confirmed")

      // Vytvoření notifikace pro žadatele
      await db.createNotification({
        user_id: booking.borrower_id,
        title: "Rezervace potvrzena!",
        message: `Vaše rezervace předmětu "${booking.item?.title}" byla potvrzena.`,
        type: "booking_confirmed",
        is_read: false,
      })

      // Refresh stránky
      window.location.reload()
    } catch (error) {
      console.error("Error confirming booking:", error)
    }
  }

  const handleCancelBooking = async () => {
    if (!confirm("Opravdu chcete zrušit tuto rezervaci?")) {
      return
    }

    try {
      await db.updateBookingStatus(booking.id, "cancelled")

      // Create notification for the other user
      const otherUserId = isOwner ? booking.borrower_id : booking.item?.owner_id || ""
      await db.createNotification({
        user_id: otherUserId,
        title: "Rezervace zrušena",
        message: `Rezervace předmětu "${booking.item?.title}" byla zrušena.`,
        type: "booking_cancelled",
        is_read: false,
      })

      // Refresh page
      window.location.reload()
    } catch (error) {
      console.error("Error cancelling booking:", error)
    }
  }

  return (
    <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Levá část - Info o předmětu */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative h-16 w-16 rounded overflow-hidden">
              <img
                src={booking.item?.images[0] || "/placeholder.svg?height=64&width=64"}
                alt={booking.item?.title}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{booking.item?.title}</h3>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(booking.start_date).toLocaleDateString("cs-CZ")} -{" "}
                  {new Date(booking.end_date).toLocaleDateString("cs-CZ")}
                </div>

                {booking.item?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {booking.item.location}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Badge className={statusColors[booking.status]}>{statusLabels[booking.status]}</Badge>
                <span className="text-sm font-medium text-gray-900">{booking.total_amount} Kč</span>
              </div>
            </div>
          </div>

          {/* Střední část - Info o uživateli */}
          <div className="flex items-center space-x-3 lg:mx-6">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{otherUser?.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div>
              <p className="font-medium">{otherUser?.name}</p>
              <p className="text-sm text-gray-500">{isOwner ? "Zájemce" : "Majitel"}</p>

              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-2">Hodnocení:</span>
                <span className="text-xs font-medium">{otherUser?.reputation_score?.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Pravá část - Akce */}
          <div className="flex flex-col space-y-2 lg:w-48">
            {/* Kontaktní informace */}
            <div className="flex space-x-2">
              {otherUser?.phone && (
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="h-3 w-3 mr-1" />
                  <a href={`tel:${otherUser.phone}`} className="text-xs">
                    Zavolat
                  </a>
                </Button>
              )}

              <Button size="sm" variant="outline" className="flex-1">
                <Mail className="h-3 w-3 mr-1" />
                <a href={`mailto:${otherUser?.email}`} className="text-xs">
                  E-mail
                </a>
              </Button>
            </div>

            {/* Akční tlačítka pro majitele */}
            {isOwner && booking.status === "pending" && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleConfirmBooking}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 shadow-soft"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Potvrdit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelBooking}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Odmítnout
                </Button>
              </div>
            )}

            {/* Tlačítko pro zrušení potvrzené rezervace */}
            {booking.status === "confirmed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelBooking}
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Zrušit rezervaci
              </Button>
            )}

            {/* Zpráva od žadatele */}
            {booking.message && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                <p className="text-gray-600">
                  <MessageSquare className="h-3 w-3 inline mr-1" />"{booking.message}"
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
