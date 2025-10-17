"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MapPin, Calendar, MoreVertical, Edit, Trash2, Hexagon, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserHives, getAllHives, createDocument, updateDocument, deleteDocument, getDocument } from "@/lib/db-utils"
import type { Hive } from "@/lib/db-utils"

interface UserData {
  fullName: string
  email: string
}

export default function HivesPage() {
  const { userData } = useAuth()
  const [hives, setHives] = useState<Hive[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHive, setEditingHive] = useState<Hive | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({})

  // Form state
  const [location, setLocation] = useState("")
  const [userName, setUserName] = useState("")
  const [installationDate, setInstallationDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = userData?.role === "admin"

  useEffect(() => {
    if (userData?.uid) {
      loadHives()
    }
  }, [userData?.uid])

  const loadHives = async () => {
    if (!userData?.uid) return
    try {
      let hivesData: Hive[]
      if (isAdmin) {
        hivesData = await getAllHives()
        const userIds = [...new Set(hivesData.map((h) => h.userId))]
        const usersData: Record<string, UserData> = {}
        await Promise.all(
          userIds.map(async (userId) => {
            const user = await getDocument<UserData>("users", userId)
            if (user) {
              usersData[userId] = user
            }
          }),
        )
        setUsersMap(usersData)
      } else {
        hivesData = await getUserHives(userData.uid)
      }
      setHives(hivesData)
    } catch (error) {
      console.error("Error loading hives:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setLocation("")
    setUserName("")
    setInstallationDate("")
    setEditingHive(null)
  }

  const formatDateForInput = (date: any): string => {
    try {
      if (date && typeof date.toDate === "function") {
        return date.toDate().toISOString().split("T")[0]
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0]
      }
      if (date) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split("T")[0]
        }
      }
      return new Date().toISOString().split("T")[0]
    } catch (error) {
      console.error("Error formatting date:", error)
      return new Date().toISOString().split("T")[0]
    }
  }

  const formatDateForDisplay = (date: any): string => {
    try {
      if (date && typeof date.toDate === "function") {
        return date.toDate().toLocaleDateString()
      }
      if (date instanceof Date) {
        return date.toLocaleDateString()
      }
      if (date) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString()
        }
      }
      return "Invalid Date"
    } catch (error) {
      console.error("Error formatting date for display:", error)
      return "Invalid Date"
    }
  }

  const handleOpenDialog = (hive?: Hive) => {
    if (hive && !isAdmin && hive.userId !== userData?.uid) {
      return
    }
    if (hive) {
      setEditingHive(hive)
      setLocation(hive.location)
      setUserName(hive.userName || "")
      setInstallationDate(formatDateForInput(hive.installationDate))
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData?.uid) return

    setSubmitting(true)
    try {
      const hiveData = {
        userId: userData.uid,
        userName,
        hiveNumber: editingHive?.hiveNumber || `HV-${Date.now().toString().slice(-8)}`,
        location,
        installationDate: new Date(installationDate),
        status: "pending" as const,
      }

      if (editingHive?.id) {
        await updateDocument("hives", editingHive.id, hiveData)
      } else {
        await createDocument<Hive>("hives", hiveData)
      }

      await loadHives()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving hive:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (hiveId: string) => {
    const hive = hives.find((h) => h.id === hiveId)
    if (!isAdmin && hive?.userId !== userData?.uid) {
      return
    }

    if (!confirm("Are you sure you want to delete this hive?")) return

    try {
      await deleteDocument("hives", hiveId)
      await loadHives()
    } catch (error) {
      console.error("Error deleting hive:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{isAdmin ? "All Hives" : "My Hives"}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "View and manage all registered hives" : "View and manage your registered hives"}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hive
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHive ? "Edit Hive" : "Add New Hive"}</DialogTitle>
                <DialogDescription>
                  {editingHive ? "Update your hive information" : "Register a new hive for admin confirmation"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., North Field, Garden Area"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userName">User Name</Label>
                  <Input
                    id="userName"
                    placeholder="Name of person using this hive"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installationDate">Installation Date</Label>
                  <Input
                    id="installationDate"
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? "Saving..." : editingHive ? "Update Hive" : "Add Hive"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hives...</p>
        </div>
      ) : hives.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Hexagon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hives yet</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin ? "No hives have been registered yet" : "Get started by adding your first hive"}
              </p>
              {!isAdmin && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Hive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hives.map((hive) => (
            <Card key={hive.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hexagon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{hive.hiveNumber}</CardTitle>
                      <Badge
                        variant={
                          hive.status === "confirmed" ? "default" : hive.status === "pending" ? "secondary" : "outline"
                        }
                        className="mt-1"
                      >
                        {hive.status}
                      </Badge>
                    </div>
                  </div>
                  {(!isAdmin || hive.userId === userData?.uid) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(hive)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(hive.id!)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{hive.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{hive.userName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatDateForDisplay(hive.installationDate)}</span>
                </div>
                {isAdmin && usersMap[hive.userId] && hive.userId !== userData?.uid && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Owner: {usersMap[hive.userId].fullName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
