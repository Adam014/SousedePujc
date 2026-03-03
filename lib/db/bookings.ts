import { supabase } from "../supabase"
import type { Booking } from "../types"
import { BOOKING_WITH_ITEM_OWNER_BORROWER, BOOKING_WITH_ITEM_BORROWER } from "./select-patterns"

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_ITEM_OWNER_BORROWER)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookings:", error)
    throw error
  }

  return data || []
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_ITEM_OWNER_BORROWER)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    console.error("Error fetching booking:", error)
    throw error
  }

  return data
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_ITEM_OWNER_BORROWER)
    .eq("borrower_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookings by user:", error)
    throw error
  }

  const bookingsWithOwners =
    data?.map((booking) => {
      if (!booking.item?.owner) {
        console.warn("Missing owner data for booking:", booking.id)
      }
      return booking
    }) || []

  return bookingsWithOwners
}

export async function getBookingsByOwner(ownerId: string): Promise<Booking[]> {
  try {
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id")
      .eq("owner_id", ownerId)

    if (itemsError) {
      console.error("Error fetching owner items:", itemsError)
      throw itemsError
    }

    if (!items || items.length === 0) return []

    const itemIds = items.map((item) => item.id)

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(BOOKING_WITH_ITEM_BORROWER)
      .in("item_id", itemIds)
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("Error fetching bookings by owner:", bookingsError)
      throw bookingsError
    }

    return bookings || []
  } catch (error) {
    console.error("Error in getBookingsByOwner:", error)
    throw error
  }
}

export async function getBookingsForItem(itemId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_ITEM_BORROWER)
    .eq("item_id", itemId)
    .neq("status", "cancelled")
    .order("start_date", { ascending: true })

  if (error) {
    console.error("Error fetching bookings for item:", error)
    throw error
  }

  return data || []
}

export async function getAllBookingsForItem(itemId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_ITEM_BORROWER)
    .eq("item_id", itemId)
    .order("start_date", { ascending: true })

  if (error) {
    console.error("Error fetching all bookings for item:", error)
    throw error
  }

  return data || []
}

export async function createBooking(bookingData: Omit<Booking, "id" | "created_at" | "updated_at">): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .insert([bookingData])
    .select(BOOKING_WITH_ITEM_BORROWER)
    .single()

  if (error) {
    console.error("Error creating booking:", error)
    throw error
  }

  return data
}

export async function updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(BOOKING_WITH_ITEM_BORROWER)
    .single()

  if (error) {
    console.error("Error updating booking status:", error)
    throw error
  }

  return data
}

export async function updateBookingWithReason(id: string, status: Booking["status"], reason?: string): Promise<Booking | null> {
  const updateData: { status: Booking["status"]; updated_at: string; message?: string } = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (reason) {
    updateData.message = reason
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", id)
    .select(BOOKING_WITH_ITEM_BORROWER)
    .single()

  if (error) {
    console.error("Error updating booking with reason:", error)
    throw error
  }

  return data
}

export async function deleteBooking(id: string): Promise<boolean> {
  const { error } = await supabase.from("bookings").delete().eq("id", id)

  if (error) {
    console.error("Error deleting booking:", error)
    throw error
  }

  return true
}

export async function getBookingsForOwnedItems(itemIds: string[]): Promise<Booking[]> {
  if (itemIds.length === 0) return []

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_ITEM_BORROWER)
    .in("item_id", itemIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookings for owned items:", error)
    throw error
  }

  return data || []
}
