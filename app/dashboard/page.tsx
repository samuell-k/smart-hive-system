"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hexagon, Plus, Bell, BookOpen, Activity, Droplets, Weight, Wind } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserHives, getAllHives } from "@/lib/db-utils"
import Link from "next/link"
import { useEffect, useState } from "react"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Line, LineChart, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const generateMockData = () => {
  const now = new Date()
  const data = []

  for (let i = 23; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      temperature: 32 + Math.random() * 6,
      humidity: 45 + Math.random() * 30,
      weight: 15 + Math.random() * 5,
      gasLevel: Math.random() * 150,
    })
  }

  return data
}

export default function DashboardPage() {
  const { userData, user } = useAuth()
  const [totalHives, setTotalHives] = useState(0)
  const [activeHives, setActiveHives] = useState(0)
  const [loading, setLoading] = useState(true)
  const isAdmin = userData?.role === "admin"

  const [hiveStats, setHiveStats] = useState({
    temperature: 34,
    humidity: 75,
    weight: 17.9,
    gasLevel: 0,
  })

  const [trendData] = useState(generateMockData())

  useEffect(() => {
    const loadHiveData = async () => {
      if (!user) return

      try {
        const loadedHives = isAdmin ? await getAllHives() : await getUserHives(user.uid)
        setTotalHives(loadedHives.length)
        setActiveHives(loadedHives.filter((h) => h.status === "confirmed").length)
      } catch (error) {
        console.error("Error loading hives:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHiveData()
  }, [user, isAdmin])

  const getTemperatureStatus = (temp: number) => {
    if (temp >= 32 && temp <= 36) return "optimal"
    if (temp >= 30 && temp <= 38) return "warning"
    return "danger"
  }

  const getHumidityStatus = (humidity: number) => {
    if (humidity >= 50 && humidity <= 60) return "optimal"
    if (humidity >= 45 && humidity <= 70) return "warning"
    return "danger"
  }

  const getWeightStatus = (weight: number) => {
    if (weight >= 12 && weight <= 20) return "optimal"
    if (weight >= 10 && weight <= 22) return "warning"
    return "danger"
  }

  const getGasStatus = (gas: number) => {
    if (gas < 200) return "optimal"
    if (gas < 500) return "warning"
    return "danger"
  }

  const temperatureStatus = getTemperatureStatus(hiveStats.temperature)
  const humidityStatus = getHumidityStatus(hiveStats.humidity)
  const weightStatus = getWeightStatus(hiveStats.weight)
  const gasStatus = getGasStatus(hiveStats.gasLevel)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userData?.displayName}! Here's your hive overview.
          </p>
        </div>
        <Link href="/dashboard/hives">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Hive
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Hives</CardTitle>
            <Hexagon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "--" : activeHives}</div>
            <p className="text-xs text-muted-foreground">{totalHives} Total registered hives</p>
          </CardContent>
        </Card>

        <Card
          className={
            temperatureStatus === "optimal"
              ? "bg-green-50 border-green-200"
              : temperatureStatus === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Temperature</CardTitle>
            <Activity
              className={`h-4 w-4 ${temperatureStatus === "optimal" ? "text-green-600" : temperatureStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${temperatureStatus === "optimal" ? "text-green-600" : temperatureStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            >
              {hiveStats.temperature}°C
            </div>
            <p className="text-xs text-muted-foreground">Optimal range: 32°C - 36°C</p>
          </CardContent>
        </Card>

        <Card
          className={
            humidityStatus === "optimal"
              ? "bg-green-50 border-green-200"
              : humidityStatus === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Humidity</CardTitle>
            <Droplets
              className={`h-4 w-4 ${humidityStatus === "optimal" ? "text-green-600" : humidityStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${humidityStatus === "optimal" ? "text-green-600" : humidityStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            >
              {hiveStats.humidity}%
            </div>
            <p className="text-xs text-muted-foreground">Optimal range: 50% - 60%</p>
          </CardContent>
        </Card>

        <Card
          className={
            weightStatus === "optimal"
              ? "bg-green-50 border-green-200"
              : weightStatus === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Hive Weight</CardTitle>
            <Weight
              className={`h-4 w-4 ${weightStatus === "optimal" ? "text-green-600" : weightStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${weightStatus === "optimal" ? "text-green-600" : weightStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            >
              {hiveStats.weight}kg
            </div>
            <p className="text-xs text-muted-foreground">Target weight: 12kg - 20kg</p>
          </CardContent>
        </Card>

        <Card
          className={
            gasStatus === "optimal"
              ? "bg-green-50 border-green-200"
              : gasStatus === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Level</CardTitle>
            <Wind
              className={`h-4 w-4 ${gasStatus === "optimal" ? "text-green-600" : gasStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${gasStatus === "optimal" ? "text-green-600" : gasStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            >
              {hiveStats.gasLevel} ppm
            </div>
            <p className="text-xs text-muted-foreground">Safe range: {"<"} 200 ppm</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hive Metrics Trends (Last 24 Hours)</CardTitle>
          <CardDescription>
            Monitor how temperature, humidity, weight, and gas levels are changing over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              temperature: {
                label: "Temperature (°C)",
                color: "hsl(var(--chart-1))",
              },
              humidity: {
                label: "Humidity (%)",
                color: "hsl(var(--chart-2))",
              },
              weight: {
                label: "Weight (kg)",
                color: "hsl(var(--chart-3))",
              },
              gasLevel: {
                label: "Gas Level (ppm)",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[350px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gasLevel"
                  stroke="var(--color-gasLevel)"
                  name="Gas Level (ppm)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="var(--color-humidity)"
                  name="Humidity (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-temperature)"
                  name="Temperature (°C)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-weight)"
                  name="Weight (kg)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/hives">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <Hexagon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Manage Hives</CardTitle>
              <CardDescription>View and update your hive information</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/training">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <BookOpen className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Training Center</CardTitle>
              <CardDescription>Access educational materials and courses</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/notifications">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <Bell className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Check alerts and system updates</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
