"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "./types"
import { db } from "./database"
import { supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (userData: { email: string; name: string; password: string }) => Promise<boolean>
  loading: boolean
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
        setUser(userData || null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    // Cleanup listener při unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Přihlášení pomocí Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error.message)
        return false
      }

      // Získáme uživatelská data z naší databáze
      const userData = await db.getUserByEmail(email)
      if (userData) {
        setUser(userData)
        return true
      }

      // Pokud uživatel neexistuje v naší DB, odhlásíme ho ze Supabase
      await supabase.auth.signOut()
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
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

      // Registrace pomocí Supabase Auth
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
        },
      })

      if (error) {
        console.error("Registration error:", error.message)
        return false
      }

      // Vytvoříme uživatele v naší databázi
      const newUser = await db.createUser({
        email: userData.email,
        name: userData.name,
        is_verified: false,
        is_admin: false,
        reputation_score: 5.0,
      })

      setUser(newUser)
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const contextValue = { user, login, logout, register, loading }
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
