import { ref, push, get, query, orderByKey, limitToLast } from "firebase/database"
import { database } from "./firebase"
import type { HiveMetrics } from "./realtime-db-utils"

// Interface for historical data points
export interface HistoricalDataPoint {
  timestamp: number
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Interface for chart data
export interface ChartDataPoint {
  time: string
  temperature: number
  humidity: number
  weight: number
  gasLevel: number
}

// Store current metrics as historical data point
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

// Get historical data for the last 24 hours
export async function getHistoricalData(): Promise<ChartDataPoint[]> {
  try {
    const historicalRef = ref(database, "historicalData")
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
    
    // Query for data from the last 24 hours
    const q = query(
      historicalRef,
      orderByKey(),
      limitToLast(100) // Limit to last 100 data points for performance
    )
    
    const snapshot = await get(q)
    const dataPoints: ChartDataPoint[] = []
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      
      Object.values(data).forEach((point: any) => {
        if (point.timestamp >= twentyFourHoursAgo) {
          dataPoints.push({
            time: new Date(point.timestamp).toLocaleTimeString("en-US", { 
              hour: "2-digit", 
              minute: "2-digit" 
            }),
            temperature: point.temperature,
            humidity: point.humidity,
            weight: point.weight,
            gasLevel: point.gasLevel
          })
        }
      })
    }
    
    // Sort by timestamp and limit to reasonable number of points
    return dataPoints
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-24) // Show last 24 data points
      
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return []
  }
}

// Generate mock data for demonstration (fallback)
export function generateMockTrendData(): ChartDataPoint[] {
  const now = new Date()
  const data: ChartDataPoint[] = []
  
  for (let i = 23; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      temperature: 23 + Math.random() * 15, // 23-38°C range
      humidity: 45 + Math.random() * 30,    // 45-75% range
      weight: 0.04 + Math.random() * 20,    // 0.04-20kg range
      gasLevel: Math.random() * 200,        // 0-200 ppm range
    })
  }
  
  return data
}
