"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDocument } from "@/lib/db-utils"
import type { Training } from "@/lib/db-utils"
import { Upload, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function UploadTrainingPage() {
  const { userData } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [documentUrl, setDocumentUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/dashboard")
    }
  }, [userData, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      if (!title.trim()) {
        alert("Please provide at least a title for the training material")
        setLoading(false)
        return
      }

      const trainingData: Partial<Omit<Training, "id">> = {
        title,
        description: description || "",
        content: content || "",
        category: category || "basics",
        uploadedBy: userData?.uid || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Only add videoUrl and documentUrl if they have values
      if (videoUrl && videoUrl.trim()) {
        trainingData.videoUrl = videoUrl
      }
      if (documentUrl && documentUrl.trim()) {
        trainingData.documentUrl = documentUrl
      }

      await createDocument<Training>("trainings", trainingData as Omit<Training, "id">)
      setSuccess(true)

      // Reset form
      setTitle("")
      setDescription("")
      setContent("")
      setCategory("")
      setVideoUrl("")
      setDocumentUrl("")

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error uploading training:", error)
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-foreground">Upload Training Material</h1>
        <p className="text-muted-foreground">Add new educational content for beekeepers</p>
      </div>

      {success && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Training material uploaded successfully!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training Details</CardTitle>
          <CardDescription>Fill in the information for the new training material</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Beekeeping"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basics">Basics</SelectItem>
                  <SelectItem value="hive-management">Hive Management</SelectItem>
                  <SelectItem value="honey-production">Honey Production</SelectItem>
                  <SelectItem value="disease-prevention">Disease Prevention</SelectItem>
                  <SelectItem value="seasonal-care">Seasonal Care</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the training material"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Full training content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentUrl">Document URL</Label>
                <Input
                  id="documentUrl"
                  type="url"
                  placeholder="https://..."
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Training Material
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
