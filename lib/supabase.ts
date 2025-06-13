import { createClient } from "@supabase/supabase-js"

// Generujeme unikátní ID pro každou instanci prohlížeče
const generateBrowserId = () => {
  if (typeof window === "undefined") return ""

  const existingId = localStorage.getItem("browser_session_id")
  if (existingId) return existingId

  const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  localStorage.setItem("browser_session_id", newId)
  return newId
}

// Unikátní ID pro tuto instanci prohlížeče
const BROWSER_ID = typeof window !== "undefined" ? generateBrowserId() : ""

// Klíč pro ukládání session do localStorage
const getSessionStorageKey = () => `supabase_auth_token_${BROWSER_ID}`

// Vytvoření Supabase klienta s vlastním storage key
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      storageKey: getSessionStorageKey(),
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
