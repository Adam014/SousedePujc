"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Phone, Mail, MessageSquare, Check, X, Calendar, MapPin, HelpCircle } from "lucide-react"
import type { Booking } from "@/lib/types"
import { db } from "@/lib/database"
import RatingDisplay from "@/components/ui/rating-display"

interface BookingRequestCardProps {
  booking: Booking
}

const statusLabels = {
  pending: "Čeká na rozhodnutí",
  confirmed: "Potvrzeno",
  active: "Aktivní",
  completed: "Dokončeno",
  cancelled: "Zamítnuto",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function BookingRequestCard({ booking }: BookingRequestCardProps) {
  const [showReasonForm, setShowReasonForm] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleConfirmBooking = async () => {
    setLoading(true)
    try {
      await db.updateBookingStatus(booking.id, "confirmed")

      // Create notification for the borrower
      await db.createNotification({
        user_id: booking.borrower_id,
        title: "Rezervace potvrzena! 🎉",
        message: `Vaše rezervace předmětu "${booking.item?.title}" byla potvrzena. Můžete kontaktovat majitele.`,
        type: "booking_confirmed",
        is_read: false,
      })

      // Force page reload to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Error confirming booking:", error)
      setLoading(false)
    }
  }

  const handleRejectBooking = async () => {
    setLoading(true)
    try {
      await db.updateBookingWithReason(booking.id, "cancelled", reason)

      // Create notification for the borrower
      await db.createNotification({
        user_id: booking.borrower_id,
        title: "Rezervace zamítnuta",
        message: `Vaše rezervace předmětu "${booking.item?.title}" byla zamítnuta. ${reason ? `Důvod: ${reason}` : ""}`,
        type: "booking_cancelled",
        is_read: false,
      })

      // Force page reload to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Error rejecting booking:", error)
      setLoading(false)
    }
  }

  const handleRevertConfirmation = async () => {
    setLoading(true)
    try {
      await db.updateBookingStatus(booking.id, "pending")

      // Create notification for the borrower
      await db.createNotification({
        user_id: booking.borrower_id,
        title: "Potvrzení rezervace zrušeno",
        message: `Potvrzení rezervace předmětu "${booking.item?.title}" bylo zrušeno.`,
        type: "booking_update",
        is_read: false,
      })

      // Force page reload to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Error reverting booking confirmation:", error)
      setLoading(false)
    }
  }

  const isPending = booking.status === "pending"

  return (
    <Card
      className={`shadow-soft hover:shadow-elegant transition-all duration-300 border-0 bg-white ${isPending ? "ring-2 ring-yellow-200" : ""}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header s ikonou stavu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isPending && <HelpCircle className="h-5 w-5 text-yellow-500" />}
              <Badge className={statusColors[booking.status]}>{statusLabels[booking.status]}</Badge>
            </div>
            <span className="text-sm text-gray-500">{new Date(booking.created_at).toLocaleDateString("cs-CZ")}</span>
          </div>

          {/* Info o předmětu a žadateli */}
          <div className="flex items-center space-x-4">
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
              <div className="mt-2">
                <span className="text-lg font-bold text-blue-600">{booking.total_amount} Kč</span>
                <span className="text-sm text-gray-500 ml-2">celkem</span>
              </div>
            </div>
          </div>

          {/* Info o žadateli */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={booking.borrower?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{booking.borrower?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{booking.borrower?.name}</p>
                  <RatingDisplay rating={booking.borrower?.reputation_score || 0} reviewCount={0} size="sm" />
                </div>
              </div>

              {/* Kontaktní tlačítka */}
              {booking.status === "confirmed" && (
                <div className="flex space-x-2">
                  {booking.borrower?.phone && (
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      <a href={`tel:${booking.borrower.phone}`} className="text-xs">
                        Zavolat
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Mail className="h-3 w-3 mr-1" />
                    <a href={`mailto:${booking.borrower?.email}`} className="text-xs">
                      E-mail
                    </a>
                  </Button>
                </div>
              )}
            </div>
            {booking.status === "confirmed" && (
              <div className="mt-3">
                <Button
                  onClick={handleRevertConfirmation}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                >
                  Vrátit na čekající
                </Button>
              </div>
            )}
          </div>

          {/* Zpráva od žadatele */}
          {booking.message && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                <strong>Zpráva od žadatele:</strong> "{booking.message}"
              </p>
            </div>
          )}

          {/* Akční tlačítka pro čekající žádosti */}
          {isPending && !showReasonForm && (
            <div className="flex space-x-3">
              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 shadow-soft"
              >
                <Check className="h-4 w-4 mr-2" />
                Potvrdit rezervaci
              </Button>
              <Button
                onClick={() => setShowReasonForm(true)}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Zamítnout
              </Button>
            </div>
          )}

          {/* Formulář pro důvod zamítnutí */}
          {showReasonForm && (
            <div className="space-y-3 border-t pt-4">
              <Label htmlFor="reason">Důvod zamítnutí (volitelné)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Napište důvod zamítnutí..."
                rows={3}
              />
              <div className="flex space-x-2">
                <Button onClick={handleRejectBooking} disabled={loading} variant="destructive" className="flex-1">
                  {loading ? "Zamítání..." : "Zamítnout rezervaci"}
                </Button>
                <Button onClick={() => setShowReasonForm(false)} variant="outline" className="flex-1">
                  Zrušit
                </Button>
              </div>
            </div>
          )}

          {/* Důvod zamítnutí (pokud byl zamítnut) */}
          {booking.status === "cancelled" && booking.message && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Důvod zamítnutí:</strong> {booking.message}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
