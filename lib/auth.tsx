"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

// Změnit definici AuthContextType:
type AuthContextType = {
  user: User | null
  loading: boolean
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; needsVerification?: boolean }>
  register: (data: { name: string; email: string; password: string }) => Promise<boolean>
  logout: () => Promise<void>
  resendVerification: (email: string) => Promise<boolean>
  refreshUser?: () => Promise<void> // Přidáno jako volitelné pro zpětnou kompatibilitu
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Přidat funkci pro získání uživatelských dat z profilu
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Získat dodatečná data z profilu
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        // Sloučit data z auth a profilu
        setUser({
          ...session.user,
          name: profileData?.name || session.user.email?.split("@")[0] || "Uživatel",
          avatar_url: profileData?.avatar_url || null,
        })
      } else {
        setUser(null)
      }

      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Získat dodatečná data z profilu
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        // Sloučit data z auth a profilu
        setUser({
          ...session.user,
          name: profileData?.name || session.user.email?.split("@")[0] || "Uživatel",
          avatar_url: profileData?.avatar_url || null,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Pokud je rememberMe true, nastavíme expirationTime na 30 dní, jinak na 8 hodin
          expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60,
        },
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          return { success: false, needsVerification: true }
        }
        return { success: false }
      }

      if (data.user) {
        return { success: true }
      }

      return { success: false }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false }
    }
  }

  const register = async (data: { name: string; email: string; password: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Registration error:", error)
        return false
      }

      // Vytvoření záznamu v tabulce profiles
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          email: data.email,
          name: data.name,
        },
      ])

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // I když se nepodaří vytvořit profil, registrace proběhla úspěšně
      }

      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Resend verification error:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Resend verification error:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resendVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
