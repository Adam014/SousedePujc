"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Phone, Mail, MessageSquare, Check, X, Calendar, MapPin, HelpCircle, Trash2, AlertTriangle } from "lucide-react"
import type { Booking } from "@/lib/types"
import { db } from "@/lib/database"
import RatingDisplay from "@/components/ui/rating-display"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDeleteBooking = async () => {
    if (booking.status !== "cancelled") return

    try {
      setDeleting(true)
      await db.deleteBooking(booking.id)

      // Reload the page to show the updated list
      window.location.reload()
    } catch (error) {
      console.error("Error deleting booking:", error)
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const isPending = booking.status === "pending"
  const isCancelled = booking.status === "cancelled"

  return (
    <Card
      className={`shadow-soft hover:shadow-elegant transition-all duration-300 border-0 bg-white ${isPending ? "ring-2 ring-yellow-200" : ""}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          {/* Header s ikonou stavu */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {isPending && <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
              <Badge className={`text-xs ${statusColors[booking.status]}`}>{statusLabels[booking.status]}</Badge>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">{new Date(booking.created_at).toLocaleDateString("cs-CZ")}</span>
          </div>

          {/* Info o předmětu a žadateli */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded overflow-hidden flex-shrink-0">
              <img
                src={booking.item?.images[0] || "/placeholder.svg?height=64&width=64"}
                alt={booking.item?.title}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{booking.item?.title}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {new Date(booking.start_date).toLocaleDateString("cs-CZ")} -{" "}
                  {new Date(booking.end_date).toLocaleDateString("cs-CZ")}
                </div>
                {booking.item?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{booking.item.location}</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold text-blue-600">{booking.total_amount} Kč</span>
                <span className="text-xs sm:text-sm text-gray-500 ml-2">celkem</span>
              </div>
            </div>
          </div>

          {/* Info o žadateli */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                  <AvatarImage src={booking.borrower?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{booking.borrower?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{booking.borrower?.name}</p>
                  <RatingDisplay rating={booking.borrower?.reputation_score || 0} reviewCount={0} size="sm" />
                </div>
              </div>

              {/* Kontaktní tlačítka */}
              {booking.status === "confirmed" && (
                <div className="flex gap-2">
                  {booking.borrower?.phone && (
                    <Button size="sm" variant="outline" className="flex-1 sm:flex-initial touch-target-sm" asChild>
                      <a href={`tel:${booking.borrower.phone}`}>
                        <Phone className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
                        <span className="text-xs sm:text-sm">Zavolat</span>
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-initial touch-target-sm" asChild>
                    <a href={`mailto:${booking.borrower?.email}`}>
                      <Mail className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
                      <span className="text-xs sm:text-sm">E-mail</span>
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
                  className="w-full touch-target-sm border-yellow-200 text-yellow-600 hover:bg-yellow-50"
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 touch-target bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 shadow-soft"
              >
                <Check className="h-4 w-4 mr-2" />
                <span className="text-sm">Potvrdit rezervaci</span>
              </Button>
              <Button
                onClick={() => setShowReasonForm(true)}
                variant="outline"
                className="flex-1 touch-target border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                <span className="text-sm">Zamítnout</span>
              </Button>
            </div>
          )}

          {/* Formulář pro důvod zamítnutí */}
          {showReasonForm && (
            <div className="space-y-3 border-t pt-4">
              <Label htmlFor="reason" className="text-sm">Důvod zamítnutí (volitelné)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Napište důvod zamítnutí..."
                rows={3}
                className="text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleRejectBooking} disabled={loading} variant="destructive" className="flex-1 touch-target">
                  {loading ? "Zamítání..." : "Zamítnout rezervaci"}
                </Button>
                <Button onClick={() => setShowReasonForm(false)} variant="outline" className="flex-1 touch-target">
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

          {/* Tlačítko pro smazání zamítnuté rezervace */}
          {isCancelled && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full touch-target border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="text-sm">Smazat zamítnutou rezervaci</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Smazat rezervaci
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Opravdu chcete smazat tuto zamítnutou rezervaci? Tato akce je nevratná.
                </DialogDescription>
                <DialogFooter className="flex space-x-2 justify-end">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Zrušit
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteBooking} disabled={deleting}>
                    {deleting ? "Mazání..." : "Smazat rezervaci"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
