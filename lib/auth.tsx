"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "./types"
import { db } from "./database"

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
        const savedUserId = localStorage.getItem("currentUserId")
        if (savedUserId) {
          const userData = await db.getUserById(savedUserId)
          if (userData) {
            setUser(userData)
          } else {
            localStorage.removeItem("currentUserId")
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
        localStorage.removeItem("currentUserId")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await db.getUserByEmail(email)
      if (foundUser) {
        setUser(foundUser)
        localStorage.setItem("currentUserId", foundUser.id)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUserId")
  }

  const register = async (userData: { email: string; name: string; password: string }): Promise<boolean> => {
    try {
      const existingUser = await db.getUserByEmail(userData.email)
      if (existingUser) {
        return false
      }

      const newUser = await db.createUser({
        email: userData.email,
        name: userData.name,
        is_verified: false,
        is_admin: false,
        reputation_score: 5.0,
      })

      setUser(newUser)
      localStorage.setItem("currentUserId", newUser.id)
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
