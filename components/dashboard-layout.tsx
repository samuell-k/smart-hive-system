"use client"

import type React from "react"

import { useState } from "react"
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
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { userData, signOut } = useAuth()
  const router = useRouter()
  const isAdmin = userData?.role === "admin"

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hexagon className="h-6 w-6 text-primary fill-primary/20" />
          <span className="font-bold text-foreground">Smart Hive</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
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

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
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
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-3" />
                      Manage Users
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/hives">
                    <Button variant="ghost" className="w-full justify-start">
                      <CheckCircle className="h-4 w-4 mr-3" />
                      Confirm Hives
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/training">
                    <Button variant="ghost" className="w-full justify-start">
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
                <Button variant="ghost" className="w-full justify-start">
                  <Hexagon className="h-4 w-4 mr-3" />
                  My Hives
                </Button>
              </Link>
              <Link href="/dashboard/training">
                <Button variant="ghost" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-3" />
                  Training
                </Button>
              </Link>
              <Link href="/dashboard/tips">
                <Button variant="ghost" className="w-full justify-start">
                  <Lightbulb className="h-4 w-4 mr-3" />
                  Tips & Advice
                </Button>
              </Link>
              <Link href="/dashboard/notifications">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-3" />
                  Notifications
                </Button>
              </Link>
            </nav>

            {/* Bottom Actions */}
            <div className="px-4 py-4 border-t border-border space-y-1">
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
