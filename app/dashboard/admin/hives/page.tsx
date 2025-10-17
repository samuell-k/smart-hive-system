"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getPendingHives, updateDocument } from "@/lib/db-utils"
import type { Hive } from "@/lib/db-utils"
import { Hexagon, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function formatDateForDisplay(date: any): string {
  try {
    if (!date) return "No date"
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === "function") {
      return date.toDate().toLocaleDateString()
    }
    // Handle regular Date object
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    // Try to parse as string
    return new Date(date).toLocaleDateString()
  } catch (error) {
    return "Invalid date"
  }
}

export default function ConfirmHivesPage() {
  const { userData } = useAuth()
  const router = useRouter()
  const [hives, setHives] = useState<Hive[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: "confirm" | "reject"
    hiveId: string
    hiveNumber: string
  } | null>(null)

  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/dashboard")
    }
  }, [userData, router])

  useEffect(() => {
    loadPendingHives()
  }, [])

  const loadPendingHives = async () => {
    try {
      const hivesData = await getPendingHives()
      setHives(hivesData)
    } catch (error) {
      console.error("Error loading hives:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmClick = (hiveId: string, hiveNumber: string) => {
    setPendingAction({ type: "confirm", hiveId, hiveNumber })
    setDialogOpen(true)
  }

  const handleRejectClick = (hiveId: string, hiveNumber: string) => {
    setPendingAction({ type: "reject", hiveId, hiveNumber })
    setDialogOpen(true)
  }

  const executeAction = async () => {
    if (!pendingAction) return

    try {
      if (pendingAction.type === "confirm") {
        await updateDocument("hives", pendingAction.hiveId, { status: "confirmed" })
      } else {
        await updateDocument("hives", pendingAction.hiveId, { status: "inactive" })
      }
      setHives(hives.filter((h) => h.id !== pendingAction.hiveId))
    } catch (error) {
      console.error(`Error ${pendingAction.type}ing hive:`, error)
    } finally {
      setDialogOpen(false)
      setPendingAction(null)
    }
  }

  if (!userData || userData.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Confirm Hives</h1>
        <p className="text-muted-foreground">Review and approve pending hive registrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hives.map((hive) => (
          <div key={hive.id} className="p-4 border border-border rounded-lg space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hexagon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Hive {hive.hiveNumber}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {hive.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateForDisplay(hive.installationDate)}
                  </div>
                </div>
                {hive.notes && <p className="text-sm text-muted-foreground">{hive.notes}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleConfirmClick(hive.id!, hive.hiveNumber)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleRejectClick(hive.id!, hive.hiveNumber)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "confirm" ? "Confirm Hive Registration" : "Reject Hive Registration"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "confirm"
                ? `Are you sure you want to confirm Hive ${pendingAction?.hiveNumber}? This will activate the hive and make it visible to the user.`
                : `Are you sure you want to reject Hive ${pendingAction?.hiveNumber}? This action will mark the hive as inactive.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={
                pendingAction?.type === "confirm"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {pendingAction?.type === "confirm" ? "Confirm" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
