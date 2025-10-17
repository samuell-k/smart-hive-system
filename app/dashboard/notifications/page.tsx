"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserNotifications, markNotificationAsRead } from "@/lib/db-utils"
import type { Notification } from "@/lib/db-utils"
import { CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react"

export default function NotificationsPage() {
  const { userData } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData?.uid) {
      loadNotifications()
    }
  }, [userData])

  const loadNotifications = async () => {
    if (!userData?.uid) return
    try {
      const notificationsData = await getUserNotifications(userData.uid)
      setNotifications(notificationsData)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your hive alerts and system messages</p>
        </div>
        {unreadCount > 0 && (
          <div className="text-sm bg-primary text-primary-foreground rounded px-2 py-1">{unreadCount} unread</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="space-y-3">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm">
            <div className="p-6 text-center">
              <div className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-card text-card-foreground rounded-lg shadow-sm ${
                notification.read ? "opacity-60" : "border-primary/50"
              }`}
            >
              <div className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold mb-1">{notification.title}</div>
                      <div className="text-sm mb-2">{notification.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        className="text-sm font-semibold text-primary hover:text-primary/80"
                        onClick={() => handleMarkAsRead(notification.id!)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
