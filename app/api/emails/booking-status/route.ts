import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import {
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendNewBookingRequestEmail,
  isEmailConfigured
} from '@/lib/email'

export async function POST(request: Request) {
  try {
    // Check if email service is configured
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 200 } // Return 200 to not block the booking flow
      )
    }

    const body = await request.json()
    const { bookingId, status, reason } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Missing bookingId or status' },
        { status: 400 }
      )
    }

    // Fetch booking with related data
    const targetBooking = await db.getBookingById(bookingId)

    if (!targetBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const borrower = targetBooking.borrower
    const owner = targetBooking.item?.owner

    if (!borrower?.email) {
      return NextResponse.json(
        { success: false, message: 'Borrower email not available' },
        { status: 200 }
      )
    }

    let emailSent = false

    if (status === 'confirmed') {
      emailSent = await sendBookingConfirmedEmail({
        recipientEmail: borrower.email,
        recipientName: borrower.name,
        itemTitle: targetBooking.item?.title || 'Predmet',
        startDate: targetBooking.start_date,
        endDate: targetBooking.end_date,
        totalAmount: targetBooking.total_amount,
        ownerName: owner?.name,
        ownerEmail: owner?.email,
        bookingId: targetBooking.id,
        itemId: targetBooking.item_id,
      })
    } else if (status === 'cancelled') {
      emailSent = await sendBookingCancelledEmail({
        recipientEmail: borrower.email,
        recipientName: borrower.name,
        itemTitle: targetBooking.item?.title || 'Predmet',
        startDate: targetBooking.start_date,
        endDate: targetBooking.end_date,
        totalAmount: targetBooking.total_amount,
        reason,
        bookingId: targetBooking.id,
        itemId: targetBooking.item_id,
      })
    } else if (status === 'pending' && owner?.email) {
      // New booking request - notify owner
      emailSent = await sendNewBookingRequestEmail({
        recipientEmail: owner.email,
        recipientName: owner.name,
        itemTitle: targetBooking.item?.title || 'Predmet',
        startDate: targetBooking.start_date,
        endDate: targetBooking.end_date,
        totalAmount: targetBooking.total_amount,
        borrowerName: borrower.name,
        borrowerEmail: borrower.email,
        bookingId: targetBooking.id,
        itemId: targetBooking.item_id,
      })
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent ? 'Email sent successfully' : 'Email not sent (may be disabled or error occurred)'
    })
  } catch (error) {
    console.error('Email API error:', error)
    // Return success to not block the booking flow
    return NextResponse.json(
      { success: false, message: 'Failed to send email', error: String(error) },
      { status: 200 }
    )
  }
}
