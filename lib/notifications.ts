"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Notification } from "./types"
import { db } from "./database"

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      const data = await db.getNotificationsByUser(userId)
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let mounted = true
    let interval: NodeJS.Timeout | null = null

    if (userId && mounted) {
      loadNotifications()
      
      // Polling každých 60 sekund místo 30
      interval = setInterval(() => {
        if (mounted) loadNotifications()
      }, 60000)
    }

    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [userId, loadNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find((n) => n.id === notificationId)
      if (notification && !notification.is_read) {
        // Optimistic update
        setNotifications(prev => prev.map((n) => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Persist to database
        await db.markNotificationAsRead(notificationId)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      // Revert on error
      loadNotifications()
    }
  }, [notifications, loadNotifications])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      // Optimistic update
      setNotifications(prev => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)

      // Persist to database
      await db.markAllNotificationsAsRead(userId)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      // Revert on error
      loadNotifications()
    }
  }, [userId, loadNotifications])

  return useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  }), [notifications, unreadCount, loading, markAsRead, markAllAsRead])
}
