"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog"
import { 
  Lightbulb, 
  Search, 
  Calendar, 
  Plus, 
  User, 
  BookOpen, 
  Star, 
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Target,
  Trash2
} from "lucide-react"
import { getAllTips, createDocument, deleteDocument } from "@/lib/db-utils"
import { useAuth } from "@/lib/auth-context"
import type { Tip } from "@/lib/db-utils"

export default function TipsPage() {
  const { userData } = useAuth()
  const isAdmin = userData?.role === "admin"

  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tipToDelete, setTipToDelete] = useState<Tip | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = [
    { id: "all", name: "All Tips", icon: BookOpen, color: "bg-blue-500" },
    { id: "beginner", name: "Beginner", icon: Star, color: "bg-green-500" },
    { id: "advanced", name: "Advanced", icon: TrendingUp, color: "bg-purple-500" },
    { id: "safety", name: "Safety", icon: Shield, color: "bg-red-500" },
    { id: "equipment", name: "Equipment", icon: Zap, color: "bg-orange-500" },
    { id: "health", name: "Hive Health", icon: Heart, color: "bg-pink-500" },
    { id: "general", name: "General", icon: Target, color: "bg-gray-500" },
  ]

  const formatDateForDisplay = (date: any): string => {
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
      // Handle string or number
      return new Date(date).toLocaleDateString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  useEffect(() => {
    loadTips()
  }, [])

  const loadTips = async () => {
    try {
      const tipsData = await getAllTips()
      setTips(tipsData)
    } catch (error) {
      console.error("Error loading tips:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTip = async () => {
    if (!formData.title || !formData.content) {
      alert("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      await createDocument<Tip>("tips", {
        title: formData.title,
        content: formData.content,
        author: userData?.displayName || "Admin",
        createdAt: new Date(),
      })

      // Reset form and close dialog
      setFormData({ title: "", content: "", category: "general" })
      setIsDialogOpen(false)

      // Reload tips
      await loadTips()
    } catch (error) {
      console.error("Error creating tip:", error)
      alert("Failed to create tip. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (tip: Tip) => {
    setTipToDelete(tip)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tipToDelete?.id) return

    setDeleting(true)
    try {
      await deleteDocument("tips", tipToDelete.id)
      await loadTips()
    } catch (error) {
      console.error("Error deleting tip:", error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setTipToDelete(null)
    }
  }

  const filteredTips = tips.filter((tip) => {
    const matchesSearch = 
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Since Tip interface doesn't have category, we'll just filter by search for now
    return matchesSearch
  })

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[6] // fallback to general
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-2xl p-8 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Tips & Advice
            </h1>
            <p className="text-amber-100 text-base sm:text-lg">Expert insights and best practices for successful beekeeping</p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tip
            </Button>
          )}
        </div>
      </div>

      {/* Search and Categories */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            placeholder="Search tips and advice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 sm:pl-12 h-10 sm:h-12 text-base sm:text-lg border-2 focus:border-amber-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {categories.map((category) => {
            const IconComponent = category.icon
            const isSelected = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-300 text-sm sm:text-base ${
                  isSelected
                    ? `${category.color} text-white shadow-lg scale-105`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                }`}
              >
                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tips Display */}
      {loading ? (
        <div className="text-center py-16">
          <div className="h-12 w-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-muted-foreground text-lg">Loading expert tips...</p>
        </div>
      ) : filteredTips.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">No tips found</h3>
              <p className="text-muted-foreground text-lg">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Check back later for new expert tips and advice"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTips.map((tip) => {
            const categoryInfo = getCategoryInfo("general") // Default to general since Tip doesn't have category
            const IconComponent = categoryInfo.icon
            return (
              <Card 
                key={tip.id} 
                className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-amber-200 cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${categoryInfo.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant="secondary" 
                          className={`${categoryInfo.color} text-white text-xs font-medium`}
                        >
                          {categoryInfo.name}
                        </Badge>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(tip)
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {tip.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDateForDisplay(tip.createdAt)}
                        <span className="mx-1">•</span>
                        <User className="h-3 w-3" />
                        {tip.author}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                    {tip.content}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-0 h-auto font-medium"
                    >
                      Read More →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              Add New Tip
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Share expert advice and best practices with the beekeeping community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm sm:text-base font-medium">Tip Title</Label>
              <Input
                id="title"
                placeholder="e.g., Best Practices for Winter Hive Management"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm sm:text-base font-medium">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 sm:h-12 px-3 rounded-md border border-input bg-background text-sm sm:text-base"
              >
                {categories.slice(1).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm sm:text-base font-medium">Tip Content</Label>
              <Textarea
                id="content"
                placeholder="Share your expert knowledge, step-by-step instructions, or helpful insights..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              disabled={isSubmitting}
              className="w-full sm:w-auto h-10 sm:h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTip} 
              disabled={isSubmitting}
              className="w-full sm:w-auto h-10 sm:h-12 px-6 bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting ? "Creating..." : "Create Tip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{tipToDelete?.title}</strong>? 
              This action cannot be undone and will permanently remove the tip from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Tip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
