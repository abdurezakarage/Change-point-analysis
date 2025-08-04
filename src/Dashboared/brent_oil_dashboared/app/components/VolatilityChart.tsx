'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Activity, AlertTriangle } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5000/api/analysis'

interface VolatilityChartProps {
  filters: {
    startDate: string
    endDate: string
    eventType: string
    showEvents: boolean
    showChangePoints: boolean
  }
}

interface VolatilityData {
  Date: string
  Volatility_30d: number
}

interface EventVolatility {
  event_date: string
  event_type: string
  description: string
  pre_event_volatility: number
  post_event_volatility: number
  volatility_change: number
}

export default function VolatilityChart({ filters }: VolatilityChartProps) {
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>([])
  const [eventVolatility, setEventVolatility] = useState<EventVolatility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchVolatilityData()
  }, [filters.startDate, filters.endDate])

  const fetchVolatilityData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/volatility-analysis`)
      setVolatilityData(response.data.volatility_trend || [])
      setEventVolatility(response.data.event_volatility || [])
      setSummary(response.data.summary)
      setError(null)
    } catch (err) {
      setError('Failed to load volatility data')
      console.error('Error fetching volatility data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchVolatilityData}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (volatilityData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No volatility data available</p>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-orange-600">
            Volatility: {(payload[0].value * 100).toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* Volatility Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Avg Volatility</p>
            <p className="text-lg font-semibold text-gray-900">
              {(summary.avg_volatility * 100).toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Max Volatility</p>
            <p className="text-lg font-semibold text-red-600">
              {(summary.max_volatility * 100).toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Min Volatility</p>
            <p className="text-lg font-semibold text-green-600">
              {(summary.min_volatility * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Volatility Trend Chart */}
      <div className="h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volatilityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="Date" 
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="Volatility_30d" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#f97316' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Event Volatility Impact */}
      {eventVolatility.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Event Volatility Impact</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventVolatility.slice(0, 5)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="event_type" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [(value * 100).toFixed(2) + '%', 'Volatility Change']}
                />
                <Bar 
                  dataKey="volatility_change" 
                  fill="#f97316"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart Legend */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center text-sm text-gray-600">
          <div className="w-3 h-0.5 bg-orange-500 mr-2"></div>
          30-Day Rolling Volatility
        </div>
      </div>
    </div>
  )
} 