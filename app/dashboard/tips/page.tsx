"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lightbulb, Search, Calendar, Plus } from "lucide-react"
import { getAllTips, createDocument } from "@/lib/db-utils"
import { useAuth } from "@/lib/auth-context"
import type { Tip } from "@/lib/db-utils"

export default function TipsPage() {
  const { userData } = useAuth()
  const isAdmin = userData?.role === "admin"

  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

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
        author: userData?.fullName || "Admin",
        createdAt: new Date(),
      })

      // Reset form and close dialog
      setFormData({ title: "", content: "" })
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

  const filteredTips = tips.filter(
    (tip) =>
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tips & Advice</h1>
          <p className="text-muted-foreground">Expert insights and best practices for successful beekeeping</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tip
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tips...</p>
        </div>
      ) : filteredTips.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tips found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Check back later for new tips"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTips.map((tip) => (
            <Card key={tip.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{tip.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatDateForDisplay(tip.createdAt)} • By {tip.author}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{tip.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Tip</DialogTitle>
            <DialogDescription>Share expert advice and best practices with beekeepers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter tip title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter tip content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateTip} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Tip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
