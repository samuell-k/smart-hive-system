"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hexagon, Plus, Bell, BookOpen, Activity, Droplets, Weight, Wind, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserHives, getAllHives } from "@/lib/db-utils"
import { subscribeToHiveData, getMetricStatus, type HiveMetrics } from "@/lib/realtime-db-utils"
import { getHistoricalData, storeHistoricalData, generateMockTrendData, generateTimeLabels, type ChartDataPoint } from "@/lib/historical-data-utils"
import { alertManager } from "@/lib/alert-system"
import Link from "next/link"
import { useEffect, useState } from "react"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart, Legend } from "recharts"
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
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true)
  const isAdmin = userData?.role === "admin"

  const [hiveStats, setHiveStats] = useState<HiveMetrics>({
    temperature: 0,
    humidity: 0,
    weight: 0,
    gasLevel: 0,
  })
  const [realtimeData, setRealtimeData] = useState<HiveMetrics | null>(null)
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null)
  const [showOfflinePopup, setShowOfflinePopup] = useState(false)
  const [showHiveDownAlert, setShowHiveDownAlert] = useState(false)

  const [trendData, setTrendData] = useState<any[]>([])

  // Function to check metric alerts
  const checkMetricAlerts = async (data: HiveMetrics, userId: string) => {
    try {
      // Temperature alerts
      if (data.temperature > 37) {
        await alertManager.createTemperatureHighAlert(userId, data.temperature)
      } else if (data.temperature < 35) {
        await alertManager.createTemperatureLowAlert(userId, data.temperature)
      } else if (data.temperature >= 32 && data.temperature <= 36) {
        // Temperature is in optimal range
        await alertManager.createTemperatureOptimalAlert(userId, data.temperature)
      }

      // Humidity alerts
      if (data.humidity > 70) {
        await alertManager.createHumidityHighAlert(userId, data.humidity)
      } else if (data.humidity < 50) {
        await alertManager.createHumidityLowAlert(userId, data.humidity)
      } else if (data.humidity >= 50 && data.humidity <= 60) {
        // Humidity is in optimal range
        await alertManager.createHumidityOptimalAlert(userId, data.humidity)
      }

      // Weight alerts
      const absWeight = Math.abs(data.weight)
      if (absWeight > 20) {
        await alertManager.createWeightAnomalyAlert(userId, absWeight)
      } else if (absWeight >= 12 && absWeight <= 20) {
        // Weight is in optimal range
        await alertManager.createWeightOptimalAlert(userId, absWeight)
      }

      // Gas level alerts
      if (data.gasLevel > 200) {
        await alertManager.createGasDetectedAlert(userId, data.gasLevel)
      } else if (data.gasLevel < 200) {
        // Gas level is in safe range
        await alertManager.createGasOptimalAlert(userId, data.gasLevel)
      }
    } catch (error) {
      console.error('Error checking metric alerts:', error)
    }
  }

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

  // Set up real-time listener for hive metrics
  useEffect(() => {
    const unsubscribe = subscribeToHiveData((data) => {
      if (data) {
        setRealtimeData(data)
        setHiveStats(data)
        setLastDataUpdate(new Date()) // Update timestamp when new data arrives
        
        // Check for metric-based alerts
        if (userData?.uid) {
          checkMetricAlerts(data, userData.uid)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [userData?.uid])

  // Check for offline status and show popup
  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (lastDataUpdate && userData?.uid) {
        const now = new Date()
        const timeDiff = now.getTime() - lastDataUpdate.getTime()
        const twoMinutes = 2 * 60 * 1000 // 2 minutes in milliseconds
        const tenMinutes = 10 * 60 * 1000 // 10 minutes in milliseconds
        
        // Show hive down alert after 2 minutes
        if (timeDiff > twoMinutes && timeDiff <= tenMinutes) {
          setShowHiveDownAlert(true)
          // Create notification for hive down
          await alertManager.createHiveDownAlert(userData.uid)
        }
        // Show offline popup after 10 minutes
        else if (timeDiff > tenMinutes) {
          setShowOfflinePopup(true)
          setShowHiveDownAlert(false) // Hide hive down alert when showing offline popup
          // Create notification for hive offline
          await alertManager.createHiveOfflineAlert(userData.uid)
          // Hide popup after 3 seconds
          setTimeout(() => setShowOfflinePopup(false), 3000)
        }
        // Hide alerts if data is recent
        else {
          setShowHiveDownAlert(false)
          setShowOfflinePopup(false)
        }
      }
    }

    // Check every 10 seconds
    const interval = setInterval(checkOfflineStatus, 10000)
    
    return () => clearInterval(interval)
  }, [lastDataUpdate, userData?.uid])

  // Generate hourly chart data with current time and previous hours
  useEffect(() => {
    const generateHourlyData = () => {
      const now = new Date()
      const chartData = []
      
      // Generate 8 data points: 7 previous hours + current time
      for (let i = 7; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 60 * 60 * 1000)) // Go back by hours
        
        // Use real-time data for current time (i = 0), otherwise use mock data
        const isCurrentTime = i === 0
        
        chartData.push({
          time: time.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            second: "2-digit"
          }),
          temperature: isCurrentTime ? (realtimeData?.temperature || 0) : (22 + Math.random() * 6),
          humidity: isCurrentTime ? (realtimeData?.humidity || 0) : (45 + Math.random() * 30),
          weight: isCurrentTime ? Math.abs(realtimeData?.weight || 0) : (15 + Math.random() * 5),
          gasLevel: isCurrentTime ? (realtimeData?.gasLevel || 0) : (Math.random() * 150)
        })
      }
      
      setTrendData(chartData)
      console.log('Hourly chart data:', chartData)
    }

    generateHourlyData()
  }, [realtimeData]) // Re-run when real-time data changes
  const temperatureStatus = getMetricStatus(hiveStats.temperature, 'temperature')
  const humidityStatus = getMetricStatus(hiveStats.humidity, 'humidity')
  const weightStatus = getMetricStatus(hiveStats.weight, 'weight')
  const gasStatus = getMetricStatus(hiveStats.gasLevel, 'gasLevel')

  return (
    <div className="space-y-8">
      {/* Hive Down Alert - 2 minutes */}
      {showHiveDownAlert && (
        <div className="fixed top-4 right-4 z-50 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg border border-orange-600 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div>
              <div className="font-semibold">⚠️ Hive Down Alert</div>
              <div className="text-sm opacity-90">No data received for over 2 minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Popup Notification - 10 minutes */}
      {showOfflinePopup && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg border border-red-600 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div>
              <div className="font-semibold">🚨 Hive Offline Alert</div>
              <div className="text-sm opacity-90">No data received for over 10 minutes</div>
            </div>
          </div>
        </div>
      )}
      {showWelcomeBanner && (
        <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 border-2 border-emerald-300 rounded-xl p-6 flex items-center shadow-xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-emerald-200 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 group">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full group-hover:scale-110 transition-transform duration-700"></div>
          </div>
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse group-hover:via-white/30 group-hover:animate-none group-hover:translate-x-full transition-all duration-1000"></div>
          
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-green-400/20 to-teal-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg group-hover:bg-white/30 group-hover:shadow-xl transition-all duration-300">
                <Hexagon className="h-8 w-8 text-white drop-shadow-lg group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="absolute -inset-1 bg-white/30 rounded-2xl blur-sm group-hover:bg-white/40 group-hover:blur-md transition-all duration-300"></div>
            </div>
            <div className="group-hover:translate-x-1 transition-transform duration-300">
              <h3 className="font-bold text-2xl text-white drop-shadow-lg mb-1 group-hover:text-emerald-50 transition-colors duration-300">
                Welcome to Smart Hive Solutions! <span className="group-hover:animate-bounce inline-block">🐝</span>
              </h3>
              <p className="text-emerald-100 text-base font-medium drop-shadow-md group-hover:text-emerald-50 transition-colors duration-300">
                Manage your hives, monitor metrics, and access training materials all in one place.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userData?.displayName}! Here's your hive overview.
            {realtimeData && (
               <span className="ml-2 inline-flex items-center gap-2 text-green-600 text-base font-medium">
                 <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse inline-block"></span>
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

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
         <Card className="bg-gradient-to-br from-white/90 to-gray-50/80 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all duration-300 cursor-pointer">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-slate-900">Active Hives</CardTitle>
             <Hexagon className="h-3 w-3 text-emerald-600" />
          </CardHeader>
           <CardContent className="px-3 pb-3">
             <div className="text-lg font-bold text-slate-900">{loading ? "-------" : activeHives.toFixed(2)}</div>
             <p className="text-xs text-slate-700">{totalHives} Total registered hives</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-gray-50/80 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-red-400 transition-all duration-300 cursor-pointer">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-slate-900">Current Temperature</CardTitle>
             <Activity
               className={`h-3 w-3 ${
            temperatureStatus === "optimal"
                   ? "text-emerald-600" 
              : temperatureStatus === "warning"
                     ? "text-amber-600" 
                     : "text-rose-600"
               }`}
            />
          </CardHeader>
           <CardContent className="px-3 pb-3">
             <div className="text-lg font-bold text-slate-900">
               {hiveStats.temperature < 0 ? "-------°C" : `${hiveStats.temperature.toFixed(2)}°C`}
            </div>
             <p className="text-xs text-slate-700">Optimal range: 32°C - 36°C</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-gray-50/80 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 cursor-pointer">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-slate-900">Current Humidity</CardTitle>
             <Droplets
               className={`h-3 w-3 ${
            humidityStatus === "optimal"
                   ? "text-emerald-600" 
              : humidityStatus === "warning"
                     ? "text-amber-600" 
                     : "text-rose-600"
               }`}
            />
          </CardHeader>
           <CardContent className="px-3 pb-3">
             <div className="text-lg font-bold text-slate-900">
               {hiveStats.humidity < 0 ? "-------%" : `${hiveStats.humidity.toFixed(2)}%`}
            </div>
             <p className="text-xs text-slate-700">Optimal range: 50% - 60%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-gray-50/80 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-orange-400 transition-all duration-300 cursor-pointer">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-slate-900">Current Hive Weight</CardTitle>
             <Weight
               className={`h-3 w-3 ${
            weightStatus === "optimal"
                   ? "text-emerald-600" 
              : weightStatus === "warning"
                     ? "text-amber-600" 
                     : "text-rose-600"
               }`}
            />
          </CardHeader>
           <CardContent className="px-3 pb-3">
             <div className="text-lg font-bold text-slate-900">
               {hiveStats.weight < 0 ? "-------kg" : `${hiveStats.weight.toFixed(2)}kg`}
            </div>
             <p className="text-xs text-slate-700">Target weight: 12kg - 20kg</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white/90 to-gray-50/80 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-300 cursor-pointer">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-slate-900">Gas Level</CardTitle>
             <Wind
               className={`h-3 w-3 ${
            gasStatus === "optimal"
                   ? "text-emerald-600" 
              : gasStatus === "warning"
                     ? "text-amber-600" 
                     : "text-rose-600"
               }`}
            />
          </CardHeader>
           <CardContent className="px-3 pb-3">
             <div className="text-lg font-bold text-slate-900">
               {hiveStats.gasLevel < 0 ? "------- ppm" : `${hiveStats.gasLevel.toFixed(2)} ppm`}
            </div>
             <p className="text-xs text-slate-700">Safe range: {"<"} 200 ppm</p>
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
                 color: "#10b981",
              },
              humidity: {
                label: "Humidity (%)",
                 color: "#3b82f6",
              },
              weight: {
                label: "Weight (kg)",
                 color: "#f59e0b",
              },
              gasLevel: {
                label: "Gas Level (ppm)",
                 color: "#8b5cf6",
              },
            }}
             className="h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                 data={trendData.slice(-8)}
                 margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
               >
                <CartesianGrid strokeDasharray="3 3" />
                 <XAxis 
                   dataKey="time" 
                   tick={{ fontSize: 12 }}
                   interval={0}
                   angle={-45}
                   textAnchor="end"
                   height={80}
                 />
                 <YAxis 
                   domain={[0, 150]}
                   tick={{ fontSize: 12 }}
                 />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                 <Bar
                   dataKey="temperature"
                   fill="#10b981"
                   name="Temperature (°C)"
                   radius={[2, 2, 0, 0]}
                 />
                 <Bar
                  dataKey="humidity"
                   fill="#3b82f6"
                  name="Humidity (%)"
                   radius={[2, 2, 0, 0]}
                 />
                 <Bar
                  dataKey="weight"
                   fill="#f59e0b"
                  name="Weight (kg)"
                   radius={[2, 2, 0, 0]}
                 />
                 <Bar
                   dataKey="gasLevel"
                   fill="#8b5cf6"
                   name="Gas Level (ppm)"
                   radius={[2, 2, 0, 0]}
                 />
               </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  )
}
