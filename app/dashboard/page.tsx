"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hexagon, Plus, Bell, BookOpen, Activity, Droplets, Weight, Wind, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserHives, getAllHives } from "@/lib/db-utils"
import { subscribeToHiveData, getMetricStatus, type HiveMetrics } from "@/lib/realtime-db-utils"
import { getHistoricalData, storeHistoricalData, generateMockTrendData, type ChartDataPoint } from "@/lib/historical-data-utils"
import Link from "next/link"
import { useEffect, useState } from "react"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Line, LineChart, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"


export default function DashboardPage() {
  const { userData, user } = useAuth()
  const [totalHives, setTotalHives] = useState(0)
  const [activeHives, setActiveHives] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true)
  const isAdmin = userData?.role === "admin"

  const [hiveStats, setHiveStats] = useState<HiveMetrics>({
    temperature: 0,
    humidity: 0,
    weight: 0,
    gasLevel: 0,
  })
  const [realtimeData, setRealtimeData] = useState<HiveMetrics | null>(null)
  const [trendData, setTrendData] = useState<ChartDataPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)

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

  // Load historical data for trends chart
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const historicalData = await getHistoricalData()
        if (historicalData.length > 0) {
          setTrendData(historicalData)
        } else {
          // Use mock data if no historical data available
          setTrendData(generateMockTrendData())
        }
      } catch (error) {
        console.error("Error loading historical data:", error)
        setTrendData(generateMockTrendData())
      } finally {
        setChartLoading(false)
      }
    }

    loadHistoricalData()
  }, [])

  // Set up real-time listener for hive metrics
  useEffect(() => {
    const unsubscribe = subscribeToHiveData((data) => {
      if (data) {
        setRealtimeData(data)
        setHiveStats(data)
        
        // Store current data as historical point
        storeHistoricalData(data)
        
        // Update trend data with new point
        setTrendData(prevData => {
          const newDataPoint: ChartDataPoint = {
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            temperature: parseFloat(data.temperature.toFixed(2)),
            humidity: parseFloat(data.humidity.toFixed(2)),
            weight: data.weight < 0 ? 0 : parseFloat(data.weight.toFixed(2)),
            gasLevel: parseFloat(data.gasLevel.toFixed(2))
          }
          
          // Add new point and keep only last 24 points
          const updatedData = [...prevData, newDataPoint].slice(-24)
          return updatedData
        })
      } else {
        // Fallback to default values if no real-time data
        setHiveStats({
          temperature: 34,
          humidity: 75,
          weight: 17.9,
          gasLevel: 0,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])
  const temperatureStatus = getMetricStatus(hiveStats.temperature, 'temperature')
  const humidityStatus = getMetricStatus(hiveStats.humidity, 'humidity')
  const weightStatus = getMetricStatus(hiveStats.weight, 'weight')
  const gasStatus = getMetricStatus(hiveStats.gasLevel, 'gasLevel')

  return (
    <div className="space-y-8">
      {showWelcomeBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 rounded-full p-2">
              <Hexagon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Welcome to Smart Hive Solutions!</h3>
              <p className="text-sm text-amber-700">
                Manage your hives, monitor metrics, and access training materials all in one place.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowWelcomeBanner(false)}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userData?.displayName}! Here's your hive overview.
            {realtimeData && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                Live Data
              </span>
            )}
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
              {hiveStats.temperature.toFixed(2)}°C
            </div>
            <p className="text-xs text-muted-foreground">Optimal range: 32°C ---- 36°C</p>
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
              {hiveStats.humidity.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Optimal range: 50% ---- 60%</p>
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
              {hiveStats.weight < 0 ? "-----" : `${hiveStats.weight.toFixed(2)}kg`}
            </div>
            <p className="text-xs text-muted-foreground">Target weight: 12kg ---- 20kg</p>
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
              {hiveStats.gasLevel.toFixed(2)} ppm
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
          {chartLoading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading trend data...</p>
              </div>
            </div>
          ) : (
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
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 'dataMax + 10']}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="var(--color-temperature)"
                    name="Temperature (°C)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="var(--color-humidity)"
                    name="Humidity (%)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--color-weight)"
                    name="Weight (kg)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gasLevel"
                    stroke="var(--color-gasLevel)"
                    name="Gas Level (ppm)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
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
