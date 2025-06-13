"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Mail, MessageSquare, Check, X, Calendar, MapPin, Star } from "lucide-react"
import type { Booking } from "@/lib/types"
import { db } from "@/lib/database"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"

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
  // Explicitně určíme, kdo je majitel a kdo je zájemce
  const owner = booking.item?.owner
  const borrower = booking.borrower

  // Určíme, který uživatel je "druhá strana" podle toho, zda jsme majitel nebo zájemce
  const otherUser = isOwner ? borrower : owner

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Debug log pro kontrolu dat
  useEffect(() => {
    if (!owner) {
      console.warn("Owner data is missing for booking:", booking.id)
    }
  }, [booking])

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

  const handleDeleteBooking = async () => {
    try {
      setIsDeleting(true)
      await db.deleteBooking(booking.id)

      // Vytvoření notifikace pro majitele
      await db.createNotification({
        user_id: booking.item?.owner_id || "",
        title: "Rezervace zrušena",
        message: `Rezervace předmětu "${booking.item?.title}" byla zrušena zájemcem.`,
        type: "booking_cancelled",
        is_read: false,
      })

      // Refresh stránky
      window.location.reload()
    } catch (error) {
      console.error("Error deleting booking:", error)
      setIsDeleting(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!booking.item?.owner_id) return

    try {
      setIsSubmittingReview(true)

      await db.createReview({
        booking_id: booking.id,
        reviewer_id: booking.borrower_id,
        reviewed_id: booking.item.owner_id,
        rating,
        comment,
        review_type: "lender",
      })

      // Vytvoření notifikace pro hodnoceného uživatele
      await db.createNotification({
        user_id: booking.item.owner_id,
        title: "Nové hodnocení",
        message: `Uživatel vám zanechal nové hodnocení.`,
        type: "new_review",
        is_read: false,
      })

      setReviewDialogOpen(false)
      window.location.reload()
    } catch (error) {
      console.error("Error submitting review:", error)
      setIsSubmittingReview(false)
    }
  }

  // Určíme, zda můžeme zobrazit kontaktní informace
  const canShowContact = booking.status === "confirmed" || booking.status === "active" || booking.status === "completed"

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
              <h3 className="font-semibold text-lg">
                <Link href={`/items/${booking.item_id}`} className="hover:underline">
                  {booking.item?.title}
                </Link>
              </h3>

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
            {otherUser && (
              <Link href={`/users/${otherUser?.id}`} className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium">{otherUser?.name || "Neznámý uživatel"}</p>
                  <p className="text-sm text-gray-500">{isOwner ? "Zájemce" : "Majitel"}</p>

                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 mr-2">Hodnocení:</span>
                    <span className="text-xs font-medium">{otherUser?.reputation_score?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Pravá část - Akce */}
          <div className="flex flex-col space-y-2 lg:w-48">
            {/* Kontaktní informace - zobrazit pouze pokud je rezervace potvrzená */}
            {canShowContact && otherUser && (
              <div className="flex space-x-2">
                {otherUser.phone && (
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
            )}

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
            {isOwner && booking.status === "confirmed" && (
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

            {/* Tlačítko pro zrušení vlastní rezervace (pro zájemce) */}
            {!isOwner && booking.status === "pending" && (
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                    <X className="h-3 w-3 mr-1" />
                    Zrušit rezervaci
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Zrušit rezervaci</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                    Opravdu chcete zrušit rezervaci předmětu "{booking.item?.title}"? Tato akce je nevratná.
                  </DialogDescription>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                      Zpět
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteBooking} disabled={isDeleting}>
                      {isDeleting ? "Rušení..." : "Zrušit rezervaci"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Tlačítko pro hodnocení majitele (pouze pro potvrzené rezervace) */}
            {!isOwner && booking.status === "confirmed" && (
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Star className="h-3 w-3 mr-1" />
                    Ohodnotit majitele
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ohodnotit majitele</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="rating">Hodnocení (1-5 hvězdiček)</Label>
                      <div className="flex items-center space-x-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 cursor-pointer ${
                              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                            onClick={() => setRating(star)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">Komentář (volitelné)</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Napište svůj komentář..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                      Zrušit
                    </Button>
                    <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                      {isSubmittingReview ? "Odesílání..." : "Odeslat hodnocení"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
