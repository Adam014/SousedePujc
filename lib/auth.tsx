"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "./types"
import { db } from "./database"
import { supabase, withTimeout, TIMEOUTS } from "./supabase"

interface AuthContextType {
  user: User | null
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; needsVerification?: boolean }>
  logout: () => Promise<void>
  register: (userData: { email: string; name: string; password: string }) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Use refs to track state in callbacks without stale closures
  const isMountedRef = useRef(true)
  const isLoadingUserRef = useRef(false)
  const isInitializedRef = useRef(false)
  const userRef = useRef<User | null>(null)
  // Flag to skip SIGNED_IN handler when login() is already handling it
  const isManualAuthRef = useRef(false)

  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    isMountedRef.current = true

    const loadUserData = async (email: string, emailConfirmed: boolean, retries = 2): Promise<{ user: User | null; error: boolean }> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // No outer withTimeout — the Supabase client already has a fetch-level
          // timeout (TIMEOUTS.QUERY = 15s). Wrapping with a shorter AUTH timeout (10s)
          // causes premature failures on cold starts / slow initial connections.
          const userData = await db.getUserByEmail(email)
          if (userData) {
            // Aktualizujeme stav ověření na základě Supabase
            if (emailConfirmed && !userData.is_verified) {
              try {
                await db.updateUser(userData.id, { is_verified: true })
                userData.is_verified = true
              } catch {
                // Non-critical — don't fail the whole auth flow
              }
            }
            return { user: userData, error: false }
          }
          // User not found in database (but no error)
          return { user: null, error: false }
        } catch (error) {
          if (attempt < retries) {
            console.warn(`loadUserData attempt ${attempt + 1} failed, retrying...`)
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)))
            continue
          }
          console.error("Error loading user data after retries:", error)
          // Return error flag so we don't sign out on network errors
          return { user: null, error: true }
        }
      }
      return { user: null, error: true }
    }

    const initializeAuth = async () => {
      if (isLoadingUserRef.current) return
      isLoadingUserRef.current = true

      try {
        // Zkontrolujeme, zda je uživatel přihlášen v Supabase (s timeoutem)
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          TIMEOUTS.AUTH,
          "Auth getSession"
        )

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
        // Always reset loading state, even if unmounted (to prevent deadlock)
        isLoadingUserRef.current = false
        if (isMountedRef.current) {
          setLoading(false)
          isInitializedRef.current = true
        }
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
        // Skip if login() is already handling this
        if (isManualAuthRef.current || isLoadingUserRef.current) return
        isLoadingUserRef.current = true

        try {
          const result = await loadUserData(
            session.user.email || "",
            !!session.user.email_confirmed_at
          )
          if (result.user && isMountedRef.current) {
            setUser(result.user)
          }
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
  ): Promise<{ success: boolean; needsVerification?: boolean }> => {
    isManualAuthRef.current = true
    try {
      // Přihlášení pomocí Supabase Auth
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        TIMEOUTS.AUTH,
        "Login signInWithPassword"
      )

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
      const userData = await withTimeout(
        db.getUserByEmail(email),
        TIMEOUTS.AUTH,
        "Login getUserByEmail"
      )
      if (userData) {
        // Aktualizujeme stav ověření
        if (data.user?.email_confirmed_at && !userData.is_verified) {
          await db.updateUser(userData.id, { is_verified: true })
          userData.is_verified = true
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
    } finally {
      isManualAuthRef.current = false
    }
  }

  const logout = async () => {
    // Okamžitě vyčistíme UI stav
    setUser(null)

    // Odhlásíme ze Supabase
    await supabase.auth.signOut()
  }

  const register = async (userData: { email: string; name: string; password: string }): Promise<boolean> => {
    try {
      // Zkontrolujeme, zda uživatel již existuje v naší databázi
      const existingUser = await withTimeout(
        db.getUserByEmail(userData.email),
        TIMEOUTS.AUTH,
        "Register getUserByEmail"
      )
      if (existingUser) {
        return false
      }

      // Registrace pomocí Supabase Auth s povoleným e-mailovým ověřením
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        TIMEOUTS.AUTH,
        "Register signUp"
      )

      if (error) {
        console.error("Registration error:", error.message)
        return false
      }

      if (!data.user) {
        console.error("Registration error: no user returned from signUp")
        return false
      }

      // Vytvoříme uživatele v naší databázi (neověřený)
      // Pass the Supabase Auth UID so public.users.id matches auth.uid()
      await withTimeout(db.createUser({
        id: data.user.id,
        email: userData.email,
        name: userData.name,
        is_verified: false,
        is_admin: false,
        reputation_score: 5.0,
      }), TIMEOUTS.AUTH, "Register createUser")

      // Nebudeme uživatele automaticky přihlašovat
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        TIMEOUTS.AUTH,
        "Resend verification"
      )

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
