import { supabase } from "../supabase"
import type { Review } from "../types"
import { REVIEW_WITH_USERS } from "./select-patterns"

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_WITH_USERS)
    .eq("reviewed_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reviews by user:", error)
    throw error
  }

  return data || []
}

export async function createReview(reviewData: Omit<Review, "id" | "created_at">): Promise<Review> {
  const { data, error } = await supabase
    .from("reviews")
    .insert([reviewData])
    .select(REVIEW_WITH_USERS)
    .single()

  if (error) {
    console.error("Error creating review:", error)
    throw error
  }

  return data
}
