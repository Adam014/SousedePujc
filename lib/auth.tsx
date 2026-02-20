"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "./types"
import { db } from "./database"
import { supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; needsVerification?: boolean }>
  logout: () => void
  register: (userData: { email: string; name: string; password: string }) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Generujeme unikátní ID pro každou instanci prohlížeče
// Using crypto.getRandomValues() for cryptographically secure random ID
const generateBrowserId = () => {
  const existingId = localStorage.getItem("browser_session_id")
  if (existingId) return existingId

  // Use crypto API for secure random generation
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Use refs to track state in callbacks without stale closures
  const isMountedRef = useRef(true)
  const isLoadingUserRef = useRef(false)
  const isInitializedRef = useRef(false)
  const userRef = useRef<User | null>(null)

  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    isMountedRef.current = true

    const loadUserData = async (email: string, emailConfirmed: boolean): Promise<{ user: User | null; error: boolean }> => {
      try {
        const userData = await db.getUserByEmail(email)
        if (userData) {
          // Aktualizujeme stav ověření na základě Supabase
          if (emailConfirmed && !userData.is_verified) {
            await db.updateUser(userData.id, { is_verified: true })
            userData.is_verified = true
          }
          return { user: userData, error: false }
        }
        // User not found in database (but no error)
        return { user: null, error: false }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Return error flag so we don't sign out on network errors
        return { user: null, error: true }
      }
    }

    const initializeAuth = async () => {
      if (isLoadingUserRef.current) return
      isLoadingUserRef.current = true

      try {
        // Zkontrolujeme, zda je uživatel přihlášen v Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user && isMountedRef.current) {
          const result = await loadUserData(
            session.user.email || "",
            !!session.user.email_confirmed_at
          )

          if (result.user && isMountedRef.current) {
            setUser(result.user)
          } else if (!result.user && !result.error && isMountedRef.current) {
            // User not found in our DB (not a network error) - sign out
            await supabase.auth.signOut()
          }
          // If there was an error, keep user logged in (don't sign out on network errors)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          isInitializedRef.current = true
        }
        isLoadingUserRef.current = false
      }
    }

    // Načteme uživatele při startu
    initializeAuth()

    // Nastavíme listener pro změny autentizačního stavu
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorujeme INITIAL_SESSION - to zpracovává initializeAuth
      if (event === "INITIAL_SESSION") return

      if (event === "SIGNED_IN" && session?.user) {
        // Prevent duplicate loading
        if (isLoadingUserRef.current) return
        isLoadingUserRef.current = true

        try {
          const result = await loadUserData(
            session.user.email || "",
            !!session.user.email_confirmed_at
          )
          if (result.user && isMountedRef.current) {
            setUser(result.user)
          }
          // Don't sign out on errors during auth state change
        } catch (error) {
          console.error("Error in auth state change:", error)
        } finally {
          isLoadingUserRef.current = false
        }
      } else if (event === "SIGNED_OUT") {
        if (isMountedRef.current) {
          setUser(null)
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token byl obnoven, zkontrolujeme že máme správného uživatele
        if (!userRef.current && isMountedRef.current && !isLoadingUserRef.current) {
          isLoadingUserRef.current = true
          try {
            const result = await loadUserData(
              session.user.email || "",
              !!session.user.email_confirmed_at
            )
            if (result.user && isMountedRef.current) {
              setUser(result.user)
            }
            // Don't sign out on errors during token refresh
          } catch (error) {
            console.error("Error refreshing user on token refresh:", error)
          } finally {
            isLoadingUserRef.current = false
          }
        }
      }
    })

    // Cleanup listener při unmount
    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<{ success: boolean; needsVerification?: boolean }> => {
    try {
      // Přihlášení pomocí Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Zkontrolujeme, zda je problém s neověřeným e-mailem
        if (error.message.includes("Email not confirmed")) {
          return { success: false, needsVerification: true }
        }
        console.error("Login error:", error.message)
        return { success: false }
      }

      // Pokud není e-mail ověřen, odhlásíme uživatele
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut()
        return { success: false, needsVerification: true }
      }

      // Získáme uživatelská data z naší databáze
      const userData = await db.getUserByEmail(email)
      if (userData) {
        // Aktualizujeme stav ověření
        if (data.user?.email_confirmed_at && !userData.is_verified) {
          await db.updateUser(userData.id, { is_verified: true })
          userData.is_verified = true
        }

        // Uložíme session token do localStorage s unikátním klíčem pro tuto instanci
        if (data.session) {
          const sessionKey = getSessionStorageKey()
          localStorage.setItem(sessionKey, JSON.stringify(data.session))
        }

        setUser(userData)
        return { success: true }
      }

      // Pokud uživatel neexistuje v naší DB, odhlásíme ho ze Supabase
      await supabase.auth.signOut()
      return { success: false }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false }
    }
  }

  const logout = async () => {
    // Odstraníme session token z localStorage
    const sessionKey = getSessionStorageKey()
    localStorage.removeItem(sessionKey)

    await supabase.auth.signOut()
    setUser(null)
  }

  const register = async (userData: { email: string; name: string; password: string }): Promise<boolean> => {
    try {
      // Zkontrolujeme, zda uživatel již existuje v naší databázi
      const existingUser = await db.getUserByEmail(userData.email)
      if (existingUser) {
        return false
      }

      // Registrace pomocí Supabase Auth s povoleným e-mailovým ověřením
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Registration error:", error.message)
        return false
      }

      // Vytvoříme uživatele v naší databázi (neověřený)
      // Pass the Supabase Auth UID so public.users.id matches auth.uid()
      await db.createUser({
        id: data.user!.id,
        email: userData.email,
        name: userData.name,
        is_verified: false,
        is_admin: false,
        reputation_score: 5.0,
      })

      // Nebudeme uživatele automaticky přihlašovat
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Resend verification error:", error.message)
        return false
      }

      return true
    } catch (error) {
      console.error("Resend verification error:", error)
      return false
    }
  }

  // Přidáme funkci pro refresh uživatele
  const refreshUser = async () => {
    if (!user) return

    try {
      const userData = await db.getUserById(user.id)
      if (userData) {
        setUser(userData)
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  // Přidáme refreshUser do context value
  const contextValue = { user, login, logout, register, resendVerification, refreshUser, loading }
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
