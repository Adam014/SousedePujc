import { createClient } from "@supabase/supabase-js"

// Timeout utility to prevent infinite hangs on Supabase operations
export function withTimeout<T>(promise: Promise<T>, ms: number, label = "Operation"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

// Default timeouts
export const TIMEOUTS = {
  AUTH: 10000,      // 10s for auth operations
  QUERY: 15000,     // 15s for database queries
  MUTATION: 20000,  // 20s for inserts/updates
} as const

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

// Custom fetch with timeout to prevent infinite hangs on Supabase REST API calls
const fetchWithTimeout = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUTS.QUERY)

  // If the caller already has a signal, listen for its abort too
  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort())
  }

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout))
}

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
    global: {
      fetch: fetchWithTimeout,
    },
  },
)
