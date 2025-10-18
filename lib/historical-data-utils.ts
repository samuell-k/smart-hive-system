import { ref, push, get, query, orderByChild, limitToLast } from "firebase/database"
import { database } from "./firebase"
import type { HiveMetrics } from "./realtime-db-utils"

// Interface for storing historical data points
export interface HistoricalDataPoint {
  timestamp: number
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Interface for chart data points
export interface ChartDataPoint {
  time: string
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Function to store current hive metrics as historical data
export async function storeHistoricalData(metrics: HiveMetrics): Promise<void> {
  try {
    const historicalRef = ref(database, "historicalData")
    const dataPoint: HistoricalDataPoint = {
      timestamp: Date.now(),
      temperature: metrics.temperature,
      humidity: metrics.humidity,
      weight: metrics.weight,
      gasLevel: metrics.gasLevel
    }
    
    await push(historicalRef, dataPoint)
  } catch (error) {
    console.error("Error storing historical data:", error)
  }
}

// Function to get historical data for the last 24 hours
export async function getHistoricalData(): Promise<ChartDataPoint[]> {
  try {
    const historicalRef = ref(database, "historicalData")
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
    
    // Query for data from the last 24 hours, limited to last 100 entries
    const recentDataQuery = query(
      historicalRef,
      orderByChild("timestamp"),
      limitToLast(100)
    )
    
    const snapshot = await get(recentDataQuery)
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      const dataPoints: HistoricalDataPoint[] = Object.values(data)
      
      // Filter for last 24 hours and format for chart
      const chartData: ChartDataPoint[] = dataPoints
        .filter(point => point.timestamp >= twentyFourHoursAgo)
        .map(point => ({
          time: new Date(point.timestamp).toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit" 
          }),
          temperature: point.temperature,
          humidity: point.humidity,
          weight: point.weight,
          gasLevel: point.gasLevel
        }))
        .slice(-24) // Keep only last 24 points
      
      return chartData
    }
    
    return []
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return []
  }
}

// Function to generate mock trend data for demonstration
export function generateMockTrendData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const now = new Date()
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * 60 * 60 * 1000))
    const hour = time.getHours()
    
    // Generate realistic mock data with some variation
    const baseTemp = 34 + Math.sin(hour * Math.PI / 12) * 2
    const baseHumidity = 55 + Math.cos(hour * Math.PI / 12) * 5
    const baseWeight = 16 + Math.sin(hour * Math.PI / 6) * 1
    const baseGas = 50 + Math.random() * 20
    
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      temperature: parseFloat((baseTemp + (Math.random() - 0.5) * 2).toFixed(2)),
      humidity: parseFloat((baseHumidity + (Math.random() - 0.5) * 4).toFixed(2)),
      weight: parseFloat((baseWeight + (Math.random() - 0.5) * 0.5).toFixed(2)),
      gasLevel: parseFloat((baseGas + (Math.random() - 0.5) * 10).toFixed(2))
    })
  }
  
  return data
}
