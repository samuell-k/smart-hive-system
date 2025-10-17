"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HiveStatsCardProps {
  title: string
  value: string | number
  unit?: string
  description: string
  status?: "optimal" | "warning" | "danger"
  icon?: React.ReactNode
}

export function HiveStatsCard({ title, value, unit, description, status = "optimal", icon }: HiveStatsCardProps) {
  const statusColors = {
    optimal: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  }

  const statusBgColors = {
    optimal: "bg-green-50 dark:bg-green-950/20",
    warning: "bg-amber-50 dark:bg-amber-950/20",
    danger: "bg-red-50 dark:bg-red-950/20",
  }

  return (
    <Card className={cn("transition-colors", statusBgColors[status])}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium">{title}</CardDescription>
          {icon && <div className={cn("h-5 w-5", statusColors[status])}>{icon}</div>}
        </div>
        <CardTitle className={cn("text-3xl font-bold", statusColors[status])}>
          {value}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
