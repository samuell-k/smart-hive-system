"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hexagon, Plus, Bell, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserHives, getAllHives } from "@/lib/db-utils"
import Link from "next/link"
import { useEffect, useState } from "react"
import { HiveStatsCard } from "@/components/hive-stats-card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userData?.displayName}! Here's {isAdmin ? "the system" : "your hive"} overview.
          </p>
        </div>
        <Link href="/dashboard/hives">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Hive
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <HiveStatsCard
          title={isAdmin ? "All Active Hives" : "Active Hives"}
          value={loading ? "--" : activeHives}
          description={`${totalHives} Total ${isAdmin ? "system" : "registered"} hives`}
          status="optimal"
          icon={<Hexagon className="h-5 w-5" />}
        />

        <HiveStatsCard
          title="Current Temperature"
          value={hiveStats.temperature}
          unit="°C"
          description="Optimal range: 32°C - 36°C"
          status={getTemperatureStatus(hiveStats.temperature)}
          icon={<Hexagon className="h-5 w-5" />}
        />

        <HiveStatsCard
          title="Current Humidity"
          value={hiveStats.humidity}
          unit="%"
          description="Optimal range: 50% - 60%"
          status={getHumidityStatus(hiveStats.humidity)}
          icon={<Hexagon className="h-5 w-5" />}
        />

        <HiveStatsCard
          title="Current Hive Weight"
          value={hiveStats.weight}
          unit="kg"
          description="Target weight: 12kg - 20kg"
          status={getWeightStatus(hiveStats.weight)}
          icon={<Hexagon className="h-5 w-5" />}
        />

        <HiveStatsCard
          title="Gas Level"
          value={hiveStats.gasLevel}
          unit="ppm"
          description="Safe range: < 200 ppm"
          status={getGasStatus(hiveStats.gasLevel)}
          icon={<Hexagon className="h-5 w-5" />}
        />
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
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-temperature)"
                  name="Temperature (°C)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="var(--color-humidity)"
                  name="Humidity (%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-weight)"
                  name="Weight (kg)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gasLevel"
                  stroke="var(--color-gasLevel)"
                  name="Gas Level (ppm)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/hives">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <Hexagon className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Manage Hives</CardTitle>
              <CardDescription>View and update your hive information</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/training">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Training Center</CardTitle>
              <CardDescription>Access educational materials and courses</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/notifications">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <Bell className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>Check alerts and system updates</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
