import { createClient } from "@supabase/supabase-js"

// Generujeme unikátní ID pro každou instanci prohlížeče
// Using crypto.getRandomValues() for cryptographically secure random ID
const generateBrowserId = () => {
  if (typeof window === "undefined") return ""

  const existingId = localStorage.getItem("browser_session_id")
  if (existingId) return existingId

  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const newId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  localStorage.setItem("browser_session_id", newId)
  return newId
}

// Unikátní ID pro tuto instanci prohlížeče
const BROWSER_ID = typeof window !== "undefined" ? generateBrowserId() : ""

// Klíč pro ukládání session do localStorage
const getSessionStorageKey = () => `supabase_auth_token_${BROWSER_ID}`

// Supabase client — uses the default fetch (no custom timeout wrapper).
// Timeouts are handled per-query via .abortSignal(AbortSignal.timeout(ms))
// where needed, not globally. A global fetch wrapper was causing race
// conditions between competing timeouts on auth and query operations.
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
