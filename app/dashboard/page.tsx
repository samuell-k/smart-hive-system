"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hexagon, Plus, Bell, BookOpen, Activity, Droplets, Weight, Wind, X, AlertTriangle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserHives, getAllHives } from "@/lib/db-utils"
import { subscribeToHiveData, getMetricStatus, type HiveMetrics } from "@/lib/realtime-db-utils"
import { getHistoricalData, storeHistoricalData, generateMockTrendData, generateTimeLabels, type ChartDataPoint } from "@/lib/historical-data-utils"
import { alertManager } from "@/lib/alert-system"
import Link from "next/link"
import { useEffect, useState } from "react"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Extend Window interface for voice interval
declare global {
  interface Window {
    hiveVoiceInterval?: NodeJS.Timeout | null
  }
}

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
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hiveLastDataUpdate')
      return stored ? new Date(stored) : null
    }
    return null
  })
  const [showOfflinePopup, setShowOfflinePopup] = useState(false)
  const [showHiveDownAlert, setShowHiveDownAlert] = useState(false)
  const [showOneMinuteAlert, setShowOneMinuteAlert] = useState(false)
  const [isDataStale, setIsDataStale] = useState(false)
  const [hasSpokenAlert, setHasSpokenAlert] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hiveHasSpokenAlert')
      return stored === 'true'
    }
    return false
  })
  const [isVoiceClosed, setIsVoiceClosed] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hiveVoiceClosed')
      return stored === 'true'
    }
    return false
  })
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false)
  const [speechQueue, setSpeechQueue] = useState<string[]>([])
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false)
  const [voiceDisabledUntil, setVoiceDisabledUntil] = useState<Date | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hiveVoiceDisabledUntil')
      return stored ? new Date(stored) : null
    }
    return null
  })
  const [alertNotifications, setAlertNotifications] = useState<Array<{
    id: string
    type: 'warning' | 'error'
    title: string
    message: string
    metric: string
  }>>([])

  const [trendData, setTrendData] = useState<any[]>([])

  // Function to update localStorage with last data update time
  const updateLastDataUpdate = (date: Date) => {
    setLastDataUpdate(date)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hiveLastDataUpdate', date.toISOString())
    }
  }

  // Function to update speech alert state in localStorage
  const updateHasSpokenAlert = (hasSpoken: boolean) => {
    setHasSpokenAlert(hasSpoken)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hiveHasSpokenAlert', hasSpoken.toString())
    }
  }

  // Function to update voice closed state in localStorage
  const updateVoiceClosed = (closed: boolean) => {
    setIsVoiceClosed(closed)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hiveVoiceClosed', closed.toString())
    }
  }

  // Function to disable voice for a specific duration
  const disableVoiceForMinutes = (minutes: number) => {
    const disabledUntil = new Date(Date.now() + minutes * 60 * 1000)
    setVoiceDisabledUntil(disabledUntil)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hiveVoiceDisabledUntil', disabledUntil.toISOString())
    }
  }

  // Function to speak alert messages using text-to-speech
  const speakAlert = (message: string) => {
    // Check if voice is temporarily disabled
    const isVoiceTemporarilyDisabled = voiceDisabledUntil && new Date() < voiceDisabledUntil
    
    if ('speechSynthesis' in window && !isVoiceClosed && !isVoiceTemporarilyDisabled) {
      // Add to queue instead of speaking immediately
      setSpeechQueue(prev => [...prev, message])
      processSpeechQueue()
    }
  }

  // Process speech queue to avoid interruptions
  const processSpeechQueue = () => {
    if (isProcessingSpeech || speechQueue.length === 0) return
    
    setIsProcessingSpeech(true)
    const message = speechQueue[0]
    setSpeechQueue(prev => prev.slice(1)) // Remove first message
    
    // Wait for any ongoing speech to finish
    if (window.speechSynthesis.speaking) {
      setTimeout(() => processSpeechQueue(), 1000)
      return
    }
    
    try {
      const utterance = new SpeechSynthesisUtterance(message)
      
      // Basic settings
      utterance.rate = 1
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onstart = () => {
        setIsVoiceSpeaking(true)
      }
      
      utterance.onend = () => {
        setIsVoiceSpeaking(false)
        setIsProcessingSpeech(false)
        
        // Process next message in queue after a delay
        setTimeout(() => {
          if (speechQueue.length > 0) {
            processSpeechQueue()
          }
        }, 500)
      }
      
      utterance.onerror = (e) => {
        setIsVoiceSpeaking(false)
        setIsProcessingSpeech(false)
        
        // Try beep pattern as fallback
        tryAlternativeAudio(message)
        
        // Process next message in queue
        setTimeout(() => {
          if (speechQueue.length > 0) {
            processSpeechQueue()
          }
        }, 1000)
      }
      
      // Speak the message
      window.speechSynthesis.speak(utterance)
      
    } catch (error) {
      setIsVoiceSpeaking(false)
      setIsProcessingSpeech(false)
      tryAlternativeAudio(message)
      
      // Process next message in queue
      setTimeout(() => {
        if (speechQueue.length > 0) {
          processSpeechQueue()
        }
      }, 1000)
    }
  }

  // Alternative audio approach using Web Audio API
  const tryAlternativeAudio = (message: string) => {
    try {
      // Create a simple beep pattern as fallback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create beep pattern: short-long-short (like SOS)
      const beepPattern = [200, 400, 200] // milliseconds
      
      beepPattern.forEach((duration, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration / 1000)
          
          if (index === beepPattern.length - 1) {
            setIsVoiceSpeaking(false)
          }
        }, index * 600)
      })
      
      setIsVoiceSpeaking(true)
      
    } catch (audioError) {
      setIsVoiceSpeaking(false)
    }
  }

  // Function to check for out-of-range values and create alert notifications
  const checkOutOfRangeAlerts = (data: HiveMetrics) => {
    const alerts: Array<{
      id: string
      type: 'warning' | 'error'
      title: string
      message: string
      metric: string
    }> = []

    // Check temperature
    if (data.temperature > 0) { // Only check if we have data
      if (data.temperature > 36) {
        alerts.push({
          id: 'temp-high',
          type: 'error',
          title: 'Temperature Too High',
          message: `Temperature is ${data.temperature.toFixed(2)}°C, above optimal range (32°C - 36°C)`,
          metric: 'temperature'
        })
      } else if (data.temperature < 32) {
        alerts.push({
          id: 'temp-low',
          type: 'warning',
          title: 'Temperature Too Low',
          message: `Temperature is ${data.temperature.toFixed(2)}°C, below optimal range (32°C - 36°C)`,
          metric: 'temperature'
        })
      }
    }

    // Check humidity
    if (data.humidity > 0) { // Only check if we have data
      if (data.humidity > 60) {
        alerts.push({
          id: 'humidity-high',
          type: 'warning',
          title: 'Humidity Too High',
          message: `Humidity is ${data.humidity.toFixed(2)}%, above optimal range (50% - 60%)`,
          metric: 'humidity'
        })
      } else if (data.humidity < 50) {
        alerts.push({
          id: 'humidity-low',
          type: 'warning',
          title: 'Humidity Too Low',
          message: `Humidity is ${data.humidity.toFixed(2)}%, below optimal range (50% - 60%)`,
          metric: 'humidity'
        })
      }
    }

    // Check weight
    if (data.weight > 0) { // Only check if we have data
      const absWeight = Math.abs(data.weight)
      if (absWeight > 20) {
        alerts.push({
          id: 'weight-high',
          type: 'error',
          title: 'Hive Weight Too High',
          message: `Hive weight is ${absWeight.toFixed(2)}kg, above target range (12kg - 20kg)`,
          metric: 'weight'
        })
      } else if (absWeight < 12) {
        alerts.push({
          id: 'weight-low',
          type: 'warning',
          title: 'Hive Weight Too Low',
          message: `Hive weight is ${absWeight.toFixed(2)}kg, below target range (12kg - 20kg)`,
          metric: 'weight'
        })
      }
    }

    // Check gas level
    if (data.gasLevel > 0) { // Only check if we have data
      if (data.gasLevel > 200) {
        alerts.push({
          id: 'gas-high',
          type: 'error',
          title: 'Gas Level Too High',
          message: `Gas level is ${data.gasLevel.toFixed(2)} ppm, above safe range (< 200 ppm)`,
          metric: 'gasLevel'
        })
      }
    }

    setAlertNotifications(alerts)
  }

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
        updateLastDataUpdate(new Date()) // Update timestamp and localStorage when new data arrives
        
        // Check for out-of-range alerts
        checkOutOfRangeAlerts(data)
        
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

  // Load speech synthesis voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices()
      }
    }
    
    // Load voices immediately
    loadVoices()
    
    // Some browsers load voices asynchronously
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
      
      // Force load voices by creating a temporary utterance
      const tempUtterance = new SpeechSynthesisUtterance('')
      window.speechSynthesis.speak(tempUtterance)
      window.speechSynthesis.cancel() // Cancel immediately
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  // Auto-process speech queue when it changes
  useEffect(() => {
    if (speechQueue.length > 0 && !isProcessingSpeech) {
      processSpeechQueue()
    }
  }, [speechQueue, isProcessingSpeech])

  // Check for offline status and show popup
  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (lastDataUpdate && userData?.uid) {
        const now = new Date()
        const timeDiff = now.getTime() - lastDataUpdate.getTime()
        const oneMinute = 1 * 60 * 1000 // 1 minute in milliseconds
        const twoMinutes = 2 * 60 * 1000 // 2 minutes in milliseconds
        const tenMinutes = 10 * 60 * 1000 // 10 minutes in milliseconds
        
        // Show one minute alert and mark data as stale after 1 minute
        if (timeDiff > oneMinute && timeDiff <= twoMinutes) {
          setShowOneMinuteAlert(true)
          setIsDataStale(true)
          setShowHiveDownAlert(false)
          setShowOfflinePopup(false)
          
          // Speak the alert message periodically (every 30 seconds)
          if (!hasSpokenAlert) {
            speakAlert("Your hive is down, please check your hive")
            updateHasSpokenAlert(true)
            
            // Set up periodic voice reminders every 30 seconds
            const voiceInterval = setInterval(() => {
              if (!isVoiceClosed) {
                speakAlert("Your hive is down, please check your hive")
              }
            }, 30000)
            
            // Store interval ID to clear it later
            if (typeof window !== 'undefined') {
              window.hiveVoiceInterval = voiceInterval
            }
          }
        }
        // Show hive down alert after 2 minutes
        else if (timeDiff > twoMinutes && timeDiff <= tenMinutes) {
          setShowHiveDownAlert(true)
          setShowOneMinuteAlert(false)
          setIsDataStale(true)
          
          // Speak the alert message periodically (every 30 seconds)
          if (!hasSpokenAlert) {
            speakAlert("Critical alert: Your hive has been down for over 2 minutes, please check immediately")
            updateHasSpokenAlert(true)
            
            // Set up periodic voice reminders every 30 seconds
            const voiceInterval = setInterval(() => {
              if (!isVoiceClosed) {
                speakAlert("Critical alert: Your hive has been down for over 2 minutes, please check immediately")
              }
            }, 30000)
            
            // Store interval ID to clear it later
            if (typeof window !== 'undefined') {
              window.hiveVoiceInterval = voiceInterval
            }
          }
          
          // Create notification for hive down
          await alertManager.createHiveDownAlert(userData.uid)
        }
        // Show offline popup after 10 minutes
        else if (timeDiff > tenMinutes) {
          setShowOfflinePopup(true)
          setShowHiveDownAlert(false)
          setShowOneMinuteAlert(false)
          setIsDataStale(true)
          
          // Speak the alert message periodically (every 30 seconds)
          if (!hasSpokenAlert) {
            speakAlert("Emergency alert: Your hive has been offline for over 10 minutes, immediate attention required")
            updateHasSpokenAlert(true)
            
            // Set up periodic voice reminders every 30 seconds
            const voiceInterval = setInterval(() => {
              if (!isVoiceClosed) {
                speakAlert("Emergency alert: Your hive has been offline for over 10 minutes, immediate attention required")
              }
            }, 30000)
            
            // Store interval ID to clear it later
            if (typeof window !== 'undefined') {
              window.hiveVoiceInterval = voiceInterval
            }
          }
          
          // Create notification for hive offline
          await alertManager.createHiveOfflineAlert(userData.uid)
          // Hide popup after 3 seconds
          setTimeout(() => setShowOfflinePopup(false), 3000)
        }
        // Hide alerts if data is recent
        else {
          setShowHiveDownAlert(false)
          setShowOfflinePopup(false)
          setShowOneMinuteAlert(false)
          setIsDataStale(false)
          updateHasSpokenAlert(false) // Reset speech flag when data is fresh
          updateVoiceClosed(false) // Reset voice closed flag when data is fresh
          
          // Clear temporary voice disable when data is fresh
          setVoiceDisabledUntil(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('hiveVoiceDisabledUntil')
          }
          
          // Clear any existing voice interval
          if (typeof window !== 'undefined' && window.hiveVoiceInterval) {
            clearInterval(window.hiveVoiceInterval)
            window.hiveVoiceInterval = null
          }
        }
      }
    }

    // Check every 10 seconds
    const interval = setInterval(checkOfflineStatus, 10000)
    
    return () => {
      clearInterval(interval)
      // Clear voice interval on cleanup
      if (typeof window !== 'undefined' && window.hiveVoiceInterval) {
        clearInterval(window.hiveVoiceInterval)
        window.hiveVoiceInterval = null
      }
    }
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
      {/* Voice Alert Control Panel */}
      {(showOneMinuteAlert || showHiveDownAlert || showOfflinePopup) && !isVoiceClosed && (
        <div className="fixed top-4 right-4 z-50 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              showOneMinuteAlert ? 'bg-yellow-500 animate-pulse' :
              showHiveDownAlert ? 'bg-orange-500 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`}></div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 text-sm">
                {showOneMinuteAlert ? '⚠️ Hive Down Alert' :
                 showHiveDownAlert ? '⚠️ Hive Down Alert' :
                 '🚨 Hive Offline Alert'}
              </div>
              <div className="text-xs text-gray-600">
                Voice notifications active
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  disableVoiceForMinutes(10)
                  // Stop any ongoing speech
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                  // Clear speech queue to prevent queued messages from playing
                  setSpeechQueue([])
                  setIsProcessingSpeech(false)
                  // Clear voice interval
                  if (typeof window !== 'undefined' && window.hiveVoiceInterval) {
                    clearInterval(window.hiveVoiceInterval)
                    window.hiveVoiceInterval = null
                  }
                }}
                className="px-3 py-1 rounded-full transition-colors bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium"
                title="Disable voice for 10 minutes"
              >
                Disable 10m
              </button>
              <button
                onClick={() => {
                  updateVoiceClosed(true)
                  // Stop any ongoing speech
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                  // Clear speech queue to prevent queued messages from playing
                  setSpeechQueue([])
                  setIsProcessingSpeech(false)
                  // Clear voice interval
                  if (typeof window !== 'undefined' && window.hiveVoiceInterval) {
                    clearInterval(window.hiveVoiceInterval)
                    window.hiveVoiceInterval = null
                  }
                }}
                className="p-2 rounded-full transition-colors bg-gray-200 hover:bg-gray-300 text-gray-600"
                title="Close voice alerts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Disabled Notification */}
      {voiceDisabledUntil && new Date() < voiceDisabledUntil && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-100 border-2 border-yellow-300 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="flex-1">
              <div className="font-semibold text-yellow-800 text-sm">
                🔇 Voice Alerts Disabled
              </div>
              <div className="text-xs text-yellow-600">
                Voice disabled until {voiceDisabledUntil.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => {
                setVoiceDisabledUntil(null)
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hiveVoiceDisabledUntil')
                }
              }}
              className="px-3 py-1 rounded-full transition-colors bg-yellow-200 hover:bg-yellow-300 text-yellow-800 text-xs font-medium"
              title="Re-enable voice alerts"
            >
              Enable Now
            </button>
          </div>
        </div>
      )}

      {/* Voice Speaking Indicator */}
      {isVoiceSpeaking && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </div>
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
                <div className="w-1 h-6 bg-white rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <div className="w-1 h-6 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.7s'}}></div>
              </div>
            </div>
            <div className="text-sm font-medium">Speaking...</div>
          </div>
        </div>
      )}


      {/* Alert Notifications for Out-of-Range Values */}
      {alertNotifications.length > 0 && (
        <div className="space-y-3">
          {alertNotifications.map((alert) => (
            <div
              key={alert.id}
              className={`relative border-2 rounded-xl p-4 shadow-lg ${
                alert.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {alert.type === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">{alert.title}</h4>
                  <p className="text-sm opacity-90">{alert.message}</p>
                </div>
                <button
                  onClick={() => setAlertNotifications(prev => prev.filter(a => a.id !== alert.id))}
                  className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
            </div>
          </div>
          ))}
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
             <div className="text-lg font-bold text-slate-900">{loading ? "---" : activeHives.toFixed(2)}</div>
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
               {hiveStats.temperature <= 0 || isDataStale ? "---°C" : `${hiveStats.temperature.toFixed(2)}°C`}
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
               {hiveStats.humidity <= 0 || isDataStale ? "---%" : `${hiveStats.humidity.toFixed(2)}%`}
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
               {hiveStats.weight <= 0 || isDataStale ? "---kg" : `${hiveStats.weight.toFixed(2)}kg`}
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
               {hiveStats.gasLevel <= 0 || isDataStale ? "--- ppm" : `${hiveStats.gasLevel.toFixed(2)} ppm`}
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
