"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Hexagon,
  LayoutDashboard,
  BookOpen,
  Bell,
  Lightbulb,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  CheckCircle,
  Upload,
  User,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserNotifications } from "@/lib/db-utils"
import type { Notification } from "@/lib/db-utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { userData, signOut } = useAuth()
  const router = useRouter()
  const isAdmin = userData?.role === "admin"
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  // Load unread notifications count
  const loadUnreadCount = async () => {
    if (!userData?.uid) return
    
    try {
      const notifications = await getUserNotifications(userData.uid)
      const unread = notifications.filter((n: Notification) => !n.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error("Error loading unread notifications:", error)
    }
  }

  // Load unread count when user data changes
  useEffect(() => {
    loadUnreadCount()
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    
    // Listen for notification read events
    const handleNotificationRead = () => {
      loadUnreadCount()
    }
    
    window.addEventListener('notificationRead', handleNotificationRead)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('notificationRead', handleNotificationRead)
    }
  }, [userData?.uid])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hexagon className="h-6 w-6 text-primary fill-primary/20" />
          <span className="font-bold text-foreground">Smart Hive</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="cursor-pointer">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-2 px-6 py-5 border-b border-border">
              <Hexagon className="h-8 w-8 text-primary fill-primary/20" />
              <span className="text-xl font-bold text-foreground">Smart Hive</span>
            </div>

            {/* User Profile Section */}
            <div className="hidden lg:block px-4 py-3 border-b border-border">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground">
                      {userData?.displayName || "User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userData?.email}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleLogout()
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start cursor-pointer">
                  <LayoutDashboard className="h-4 w-4 mr-3" />
                  Dashboard
                </Button>
              </Link>

              {isAdmin && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </div>
                  <Link href="/dashboard/admin/users">
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">
                      <Users className="h-4 w-4 mr-3" />
                      Manage Users
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/hives">
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">
                      <CheckCircle className="h-4 w-4 mr-3" />
                      Confirm Hives
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/training">
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">
                      <Upload className="h-4 w-4 mr-3" />
                      Upload Training
                    </Button>
                  </Link>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </div>
                </>
              )}

              <Link href="/dashboard/hives">
                <Button variant="ghost" className="w-full justify-start cursor-pointer">
                  <Hexagon className="h-4 w-4 mr-3" />
                  My Hives
                </Button>
              </Link>
              <Link href="/dashboard/training">
                <Button variant="ghost" className="w-full justify-start cursor-pointer">
                  <BookOpen className="h-4 w-4 mr-3" />
                  Training
                </Button>
              </Link>
              <Link href="/dashboard/tips">
                <Button variant="ghost" className="w-full justify-start cursor-pointer">
                  <Lightbulb className="h-4 w-4 mr-3" />
                  Tips & Advice
                </Button>
              </Link>
              <Link href="/dashboard/notifications">
                <Button variant="ghost" className="w-full justify-start cursor-pointer relative">
                  <Bell className="h-4 w-4 mr-3" />
                  Notifications
                  {unreadCount > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start cursor-pointer">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
