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
import { Badge } from "@/components/ui/badge"
import { createDocument } from "@/lib/db-utils"
import type { Training } from "@/lib/db-utils"
import { 
  Upload, 
  CheckCircle, 
  BookOpen, 
  Video, 
  FileText, 
  Link, 
  Star,
  Shield,
  Zap,
  Heart,
  Target,
  TrendingUp,
  GraduationCap,
  FileVideo,
  FileImage,
  File
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function UploadTrainingPage() {
  const { userData } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [duration, setDuration] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [documentUrl, setDocumentUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const categories = [
    { id: "basics", name: "Basics", icon: Star, color: "bg-green-500", description: "Fundamental beekeeping concepts" },
    { id: "hive-management", name: "Hive Management", icon: BookOpen, color: "bg-blue-500", description: "Managing and maintaining hives" },
    { id: "honey-production", name: "Honey Production", icon: Zap, color: "bg-yellow-500", description: "Harvesting and processing honey" },
    { id: "disease-prevention", name: "Disease Prevention", icon: Shield, color: "bg-red-500", description: "Health and disease management" },
    { id: "seasonal-care", name: "Seasonal Care", icon: Heart, color: "bg-pink-500", description: "Year-round hive care" },
    { id: "equipment", name: "Equipment", icon: Target, color: "bg-purple-500", description: "Tools and equipment usage" },
    { id: "advanced", name: "Advanced", icon: TrendingUp, color: "bg-orange-500", description: "Advanced beekeeping techniques" },
  ]

  const difficulties = [
    { id: "beginner", name: "Beginner", color: "bg-green-100 text-green-800" },
    { id: "intermediate", name: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
    { id: "advanced", name: "Advanced", color: "bg-red-100 text-red-800" },
  ]

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
        difficulty: difficulty || "beginner",
        duration: duration || "",
        uploadedBy: userData?.uid || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Only add URLs if they have values
      if (videoUrl && videoUrl.trim()) {
        trainingData.videoUrl = videoUrl
      }
      if (documentUrl && documentUrl.trim()) {
        trainingData.documentUrl = documentUrl
      }
      if (imageUrl && imageUrl.trim()) {
        trainingData.imageUrl = imageUrl
      }

      await createDocument<Training>("trainings", trainingData as Omit<Training, "id">)
      setSuccess(true)

      // Reset form
      setTitle("")
      setDescription("")
      setContent("")
      setCategory("")
      setDifficulty("")
      setDuration("")
      setVideoUrl("")
      setDocumentUrl("")
      setImageUrl("")

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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-8 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            Upload Training Material
          </h1>
          <p className="text-blue-100 text-lg">Add new educational content for beekeepers</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-700">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">Training material uploaded successfully!</p>
                <p className="text-green-600">The new educational content is now available to beekeepers.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-2xl font-bold flex items-center gap-2 text-black">
                <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Training Details
              </CardTitle>
              <CardDescription className="text-base text-black">
                Fill in the comprehensive information for the new training material
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium">Training Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Introduction to Beekeeping Fundamentals"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-base font-medium">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className="h-12">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-base font-medium">Difficulty Level</Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger id="difficulty" className="h-12">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((diff) => (
                            <SelectItem key={diff.id} value={diff.id}>
                              <Badge className={diff.color}>{diff.name}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base font-medium">Duration</Label>
                    <Input
                      id="duration"
                      placeholder="e.g., 30 minutes, 2 hours, 1 day"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of what beekeepers will learn from this training..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="text-base"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Training Content</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-base font-medium">Detailed Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Provide comprehensive training content, step-by-step instructions, key points, and any important notes..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      className="text-base"
                    />
                  </div>
                </div>

                {/* Media Resources */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Media Resources</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl" className="text-base font-medium flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video URL
                      </Label>
                      <Input
                        id="videoUrl"
                        type="url"
                        placeholder="https://youtube.com/..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentUrl" className="text-base font-medium flex items-center gap-2">
                        <File className="h-4 w-4" />
                        Document URL
                      </Label>
                      <Input
                        id="documentUrl"
                        type="url"
                        placeholder="https://..."
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-base font-medium flex items-center gap-2">
                        <FileImage className="h-4 w-4" />
                        Image URL
                      </Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading Training Material...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Training Material
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Categories Info */}
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-blue-500 flex items-center justify-center">
                    <BookOpen className="h-3 w-3 text-white" />
                  </div>
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {categories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <div key={category.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`h-8 w-8 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{category.name}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="shadow-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-800">
                  <div className="h-6 w-6 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  Upload Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm text-amber-700">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                    <p>Provide clear, step-by-step instructions</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                    <p>Include relevant images or videos when possible</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                    <p>Use appropriate difficulty levels</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                    <p>Add estimated duration for better planning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
