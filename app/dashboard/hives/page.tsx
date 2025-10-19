"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hiveToDelete, setHiveToDelete] = useState<Hive | null>(null)

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

  const handleDeleteClick = (hive: Hive) => {
    if (!isAdmin && hive.userId !== userData?.uid) {
      return
    }
    setHiveToDelete(hive)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!hiveToDelete?.id) return

    try {
      await deleteDocument("hives", hiveToDelete.id)
      await loadHives()
    } catch (error) {
      console.error("Error deleting hive:", error)
    } finally {
      setDeleteDialogOpen(false)
      setHiveToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{isAdmin ? "All Hives" : "My Hives"}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {isAdmin ? "View and manage all registered hives" : "View and manage your registered hives"}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="cursor-pointer w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Hive
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" disabled={submitting} className="w-full sm:flex-1">
                    {submitting ? "Saving..." : editingHive ? "Update Hive" : "Add Hive"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      resetForm()
                    }}
                    className="w-full sm:w-auto"
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
                <Button onClick={() => handleOpenDialog()} className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Hive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isAdmin ? "All Hives" : "My Hives"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "View and manage all registered hives" : "View and manage your registered hives"}
            </p>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Hive</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    {isAdmin && <TableHead className="text-xs">Owner</TableHead>}
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hives.map((hive) => (
                    <TableRow key={hive.id} className="hover:bg-muted/50">
                      <TableCell className="min-w-[140px] max-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Hexagon className="h-3 w-3 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate text-sm">{hive.hiveNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">ID: {hive.id?.slice(0, 6)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px] max-w-[120px]">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm">{hive.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px] max-w-[100px]">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm">{hive.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px] max-w-[100px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm">{formatDateForDisplay(hive.installationDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[80px] max-w-[80px]">
                        <Badge
                          variant={
                            hive.status === "confirmed" ? "default" : hive.status === "pending" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {hive.status}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="min-w-[100px] max-w-[100px]">
                          <span className="text-xs text-muted-foreground truncate block">
                            {usersMap[hive.userId] && hive.userId !== userData?.uid ? 
                              usersMap[hive.userId].fullName : "You"}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="min-w-[120px] max-w-[120px]">
                        {(!isAdmin || hive.userId === userData?.uid) && (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenDialog(hive)}
                              className="h-7 px-2 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Hive</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{hive.hiveNumber}</strong>? 
                                    This action cannot be undone and will permanently remove the hive from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteClick(hive)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Hive
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {hives.map((hive) => (
                <Card key={hive.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Hexagon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{hive.hiveNumber}</p>
                        <p className="text-xs text-muted-foreground">ID: {hive.id?.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        hive.status === "confirmed" ? "default" : hive.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {hive.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground break-words">{hive.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground break-words">{hive.userName}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground break-words">{formatDateForDisplay(hive.installationDate)}</span>
                    </div>
                    {isAdmin && (
                      <div className="text-sm text-muted-foreground break-words">
                        Owner: {usersMap[hive.userId] && hive.userId !== userData?.uid ? 
                          usersMap[hive.userId].fullName : "You"}
                      </div>
                    )}
                  </div>
                  
                  {(!isAdmin || hive.userId === userData?.uid) && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDialog(hive)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Hive</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{hive.hiveNumber}</strong>? 
                              This action cannot be undone and will permanently remove the hive from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteClick(hive)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Hive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{hiveToDelete?.hiveNumber}</strong>? 
              This action cannot be undone and will permanently remove the hive from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Hive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
