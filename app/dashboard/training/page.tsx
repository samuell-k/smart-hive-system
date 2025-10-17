"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Video, FileText, Clock, BookOpen, Search, ExternalLink } from "lucide-react"
import { getAllTrainings } from "@/lib/db-utils"
import type { Training } from "@/lib/db-utils"

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

export default function TrainingPage() {
  const { userData } = useAuth()
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    try {
      const trainingsData = await getAllTrainings()
      setTrainings(trainingsData)
    } catch (error) {
      console.error("Error loading trainings:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrainings = trainings.filter(
    (training) =>
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewTraining = (training: Training) => {
    router.push(`/dashboard/training/${training.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Center</h1>
          <p className="text-muted-foreground">Access educational materials to improve your beekeeping skills</p>
        </div>
        {userData?.role === "admin" && (
          <Button onClick={() => router.push("/dashboard/admin/training")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Upload Training
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search training materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training materials...</p>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No training materials found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Check back later for new content"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredTrainings.map((training) => (
            <Card key={training.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {training.videoUrl ? (
                        <Video className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {training.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{training.title}</CardTitle>
                    <CardDescription className="mt-1">{training.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDateForDisplay(training.createdAt)}
                  </div>
                  <Button size="sm" onClick={() => handleViewTraining(training)}>
                    View Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
