"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "./types"
import { db } from "./database"
import { supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; needsVerification?: boolean }>
  logout: () => void
  register: (userData: { email: string; name: string; password: string }) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Zkontrolujeme, zda je uživatel přihlášen v Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Získáme uživatelská data z naší databáze
          const userData = await db.getUserByEmail(session.user.email || "")
          if (userData) {
            // Aktualizujeme stav ověření na základě Supabase
            if (session.user.email_confirmed_at && !userData.is_verified) {
              await db.updateUser(userData.id, { is_verified: true })
              userData.is_verified = true
            }
            setUser(userData)
          } else {
            // Pokud uživatel existuje v Supabase, ale ne v naší DB, odhlásíme ho
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setLoading(false)
      }
    }

    // Načteme uživatele při startu
    loadUser()

    // Nastavíme listener pro změny autentizačního stavu
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userData = await db.getUserByEmail(session.user.email || "")
        if (userData) {
          // Aktualizujeme stav ověření
          if (session.user.email_confirmed_at && !userData.is_verified) {
            await db.updateUser(userData.id, { is_verified: true })
            userData.is_verified = true
          }
          setUser(userData)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    // Cleanup listener při unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; needsVerification?: boolean }> => {
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
      await db.createUser({
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
