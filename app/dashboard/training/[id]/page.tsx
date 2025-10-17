"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, FileText, Clock, ArrowLeft, ExternalLink, User } from "lucide-react"
import { getDocument } from "@/lib/db-utils"
import type { Training } from "@/lib/db-utils"

function formatDateForDisplay(date: any): string {
  try {
    if (!date) return "No date"
    if (date.toDate && typeof date.toDate === "function") {
      return date.toDate().toLocaleDateString()
    }
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  } catch (error) {
    return "Invalid date"
  }
}

export default function TrainingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const trainingId = params.id as string

  const [training, setTraining] = useState<Training | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTraining()
  }, [trainingId])

  const loadTraining = async () => {
    try {
      const trainingData = await getDocument<Training>("trainings", trainingId)
      setTraining(trainingData)
    } catch (error) {
      console.error("Error loading training:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training material...</p>
        </div>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Training not found</h3>
              <p className="text-muted-foreground">The training material you're looking for doesn't exist.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Training Center
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              {training.videoUrl ? (
                <Video className="h-6 w-6 text-primary" />
              ) : (
                <FileText className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{training.category}</Badge>
              </div>
              <CardTitle className="text-2xl mb-2">{training.title}</CardTitle>
              <CardDescription className="text-base">{training.description}</CardDescription>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateForDisplay(training.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {training.uploadedBy}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {training.videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={training.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Watch Video on External Platform
            </a>
          </CardContent>
        </Card>
      )}

      {training.documentUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={training.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Document
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">{training.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
