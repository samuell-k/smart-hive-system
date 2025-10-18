"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Video, 
  FileText, 
  Clock, 
  BookOpen, 
  Search, 
  ExternalLink,
  Star,
  Shield,
  Zap,
  Heart,
  Target,
  TrendingUp,
  GraduationCap,
  Play,
  File,
  FileImage,
  Users,
  Award,
  ChevronRight
} from "lucide-react"
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
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", name: "All Training", icon: BookOpen, color: "bg-blue-500" },
    { id: "basics", name: "Basics", icon: Star, color: "bg-green-500" },
    { id: "hive-management", name: "Hive Management", icon: BookOpen, color: "bg-blue-500" },
    { id: "honey-production", name: "Honey Production", icon: Zap, color: "bg-yellow-500" },
    { id: "disease-prevention", name: "Disease Prevention", icon: Shield, color: "bg-red-500" },
    { id: "seasonal-care", name: "Seasonal Care", icon: Heart, color: "bg-pink-500" },
    { id: "equipment", name: "Equipment", icon: Target, color: "bg-purple-500" },
    { id: "advanced", name: "Advanced", icon: TrendingUp, color: "bg-orange-500" },
  ]

  const difficulties = [
    { id: "beginner", name: "Beginner", color: "bg-green-100 text-green-800" },
    { id: "intermediate", name: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
    { id: "advanced", name: "Advanced", color: "bg-red-100 text-red-800" },
  ]

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

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch = 
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || training.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0]
  }

  const getDifficultyInfo = (difficultyId: string) => {
    return difficulties.find(diff => diff.id === difficultyId) || difficulties[0]
  }

  const handleViewTraining = (training: Training) => {
    router.push(`/dashboard/training/${training.id}`)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              Training Center
            </h1>
            <p className="text-indigo-100 text-lg">Access educational materials to improve your beekeeping skills</p>
          </div>
          {userData?.role === "admin" && (
            <Button 
              onClick={() => router.push("/dashboard/admin/training")} 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Upload Training
            </Button>
          )}
        </div>
      </div>

      {/* Search and Categories */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search training materials and courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg border-2 focus:border-purple-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const IconComponent = category.icon
            const isSelected = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  isSelected
                    ? `${category.color} text-white shadow-lg scale-105`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="font-medium">{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Training Materials Display */}
      {loading ? (
        <div className="text-center py-16">
          <div className="h-12 w-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-muted-foreground text-lg">Loading training materials...</p>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">No training materials found</h3>
              <p className="text-muted-foreground text-lg">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Check back later for new educational content"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrainings.map((training) => {
            const categoryInfo = getCategoryInfo(training.category)
            const difficultyInfo = getDifficultyInfo(training.difficulty || "beginner")
            const IconComponent = categoryInfo.icon
            return (
              <Card 
                key={training.id} 
                className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-200 cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${categoryInfo.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          className={`${categoryInfo.color} text-white text-xs font-medium`}
                        >
                          {categoryInfo.name}
                        </Badge>
                        {training.difficulty && (
                          <Badge className={difficultyInfo.color}>
                            {difficultyInfo.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {training.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {training.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Media Type Indicators */}
                    <div className="flex items-center gap-2">
                      {training.videoUrl && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Video className="h-3 w-3" />
                          <span>Video</span>
                        </div>
                      )}
                      {training.documentUrl && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <File className="h-3 w-3" />
                          <span>Document</span>
                        </div>
                      )}
                      {training.imageUrl && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileImage className="h-3 w-3" />
                          <span>Images</span>
                        </div>
                      )}
                      {training.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{training.duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Date and Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDateForDisplay(training.createdAt)}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleViewTraining(training)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
