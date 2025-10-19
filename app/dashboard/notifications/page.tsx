"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserNotifications, markNotificationAsRead, deleteNotification, deleteAllNotifications } from "@/lib/db-utils"
import type { Notification } from "@/lib/db-utils"
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Bell,
  Thermometer,
  Droplets,
  Weight,
  Wind,
  Wifi,
  WifiOff,
  Clock,
  X,
  Trash2,
  Trash
} from "lucide-react"

// Helper function to format dates properly with relative time
function formatDateForDisplay(date: any): string {
  try {
    if (!date) return "No date"
    
    let dateObj: Date
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === "function") {
      dateObj = date.toDate()
    }
    // Handle regular Date object
    else if (date instanceof Date) {
      dateObj = date
    }
    // Handle timestamp number
    else if (typeof date === 'number') {
      dateObj = new Date(date)
    }
    // Handle string date
    else if (typeof date === 'string') {
      dateObj = new Date(date)
    }
    // Try to parse as string
    else {
      dateObj = new Date(date)
    }
    
    if (isNaN(dateObj.getTime())) {
      return "Invalid date"
    }
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
    
    // Show relative time for recent dates
    if (diffInSeconds < 60) {
      return "Just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      // For older dates, show the actual date
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return "Invalid date"
  }
}

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
      
      // Dispatch custom event to update sidebar count
      window.dispatchEvent(new CustomEvent('notificationRead'))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications(notifications.filter((n) => n.id !== notificationId))
      
      // Dispatch custom event to update sidebar count
      window.dispatchEvent(new CustomEvent('notificationRead'))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleClearAllNotifications = async () => {
    if (!userData?.uid) return
    
    try {
      await deleteAllNotifications(userData.uid)
      setNotifications([])
      
      // Dispatch custom event to update sidebar count
      window.dispatchEvent(new CustomEvent('notificationRead'))
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  }

  const getIcon = (type: string, title: string) => {
    // Check for specific alert types based on title
    if (title.includes("Temperature")) {
      return <Thermometer className="h-5 w-5 text-orange-500" />
    } else if (title.includes("Humidity")) {
      return <Droplets className="h-5 w-5 text-blue-500" />
    } else if (title.includes("Weight")) {
      return <Weight className="h-5 w-5 text-purple-500" />
    } else if (title.includes("Gas")) {
      return <Wind className="h-5 w-5 text-red-500" />
    } else if (title.includes("Hive Down")) {
      return <Wifi className="h-5 w-5 text-orange-500" />
    } else if (title.includes("Hive Offline")) {
      return <WifiOff className="h-5 w-5 text-red-500" />
    }
    
    // Fallback to type-based icons
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-8 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Notifications
            </h1>
            <p className="text-blue-100 text-base sm:text-lg">Stay updated with your hive alerts and system messages</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {unreadCount > 0 && (
              <div className="bg-white/20 backdrop-blur-sm text-white rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">{unreadCount} unread</span>
              </div>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAllNotifications}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 sm:py-16">
          <div className="h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6" />
          <p className="text-muted-foreground text-base sm:text-lg">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="p-8 sm:p-16 text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2 sm:mb-3">No notifications</h3>
            <p className="text-gray-500 text-base sm:text-lg">You're all caught up! Your hives are running smoothly.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                notification.read 
                  ? "opacity-70 border-gray-200" 
                  : notification.type === "success"
                    ? "border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50"
                    : "border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
              }`}
            >
              <div className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type, notification.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{notification.title}</h3>
                        {!notification.read && (
                          <div className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
                            notification.type === "success" ? "bg-green-500" : "bg-blue-500"
                          }`}></div>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 mb-3 leading-relaxed break-words">{notification.message}</p>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>{formatDateForDisplay(notification.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full transition-colors duration-200 ${
                            notification.type === "success"
                              ? "text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200"
                              : "text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200"
                          }`}
                          onClick={() => handleMarkAsRead(notification.id!)}
                        >
                          <span className="hidden sm:inline">Mark as read</span>
                          <span className="sm:hidden">Read</span>
                        </button>
                      )}
                      <button
                        className="text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full transition-colors duration-200 text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200"
                        onClick={() => handleDeleteNotification(notification.id!)}
                        title="Delete notification"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
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
