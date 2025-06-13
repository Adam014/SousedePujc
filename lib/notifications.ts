"use client"

import { useState, useEffect } from "react"
import type { Notification } from "./types"
import { db } from "./database"

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const loadNotifications = async () => {
      try {
        const data = await db.getNotificationsByUser(userId)
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      } catch (error) {
        console.error("Error loading notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Simulace real-time aktualizací
    const interval = setInterval(loadNotifications, 30000) // každých 30 sekund

    return () => clearInterval(interval)
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find((n) => n.id === notificationId)
      if (notification && !notification.is_read) {
        // Update locally
        const updatedNotifications = notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        setNotifications(updatedNotifications)
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Persist to database
        await db.markNotificationAsRead(notificationId)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      if (!userId) return

      // Update locally
      const updatedNotifications = notifications.map((n) => ({ ...n, is_read: true }))
      setNotifications(updatedNotifications)
      setUnreadCount(0)

      // Persist to database
      await db.markAllNotificationsAsRead(userId)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  }
}
