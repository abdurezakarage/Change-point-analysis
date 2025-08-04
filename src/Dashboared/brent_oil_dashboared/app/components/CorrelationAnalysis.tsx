'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5000/api/analysis'

interface CorrelationAnalysisProps {
  filters: {
    startDate: string
    endDate: string
    eventType: string
    showEvents: boolean
    showChangePoints: boolean
  }
}

interface Correlation {
  event_date: string
  event_type: string
  description: string
  price_change_percent: number
  pre_event_avg_price: number
  post_event_avg_price: number
  impact_magnitude: number
}

export default function CorrelationAnalysis({ filters }: CorrelationAnalysisProps) {
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchCorrelationData()
  }, [])

  const fetchCorrelationData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/correlation-analysis`)
      setCorrelations(response.data.correlations || [])
      setSummary(response.data.summary)
      setError(null)
    } catch (err) {
      setError('Failed to load correlation data')
      console.error('Error fetching correlation data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchCorrelationData}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (correlations.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No correlation data available</p>
      </div>
    )
  }

  // Custom tooltip for correlation chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.event_type}</p>
          <p className="text-sm text-gray-600">{data.event_date}</p>
          <p className={`text-sm font-medium ${data.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Price Change: {data.price_change_percent >= 0 ? '+' : ''}{data.price_change_percent.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        </div>
      )
    }
    return null
  }

  // Prepare data for scatter plot
  const scatterData = correlations.map(corr => ({
    ...corr,
    x: corr.impact_magnitude,
    y: Math.abs(corr.price_change_percent)
  }))

  return (
    <div>
      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Total Events Analyzed</p>
                <p className="text-lg font-semibold text-blue-900">{summary.total_events_analyzed}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Average Price Change</p>
                <p className="text-lg font-semibold text-green-900">
                  {summary.avg_price_change >= 0 ? '+' : ''}{summary.avg_price_change.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-orange-600">Max Impact Event</p>
                <p className="text-sm font-semibold text-orange-900">
                  {summary.max_impact_event?.event_type || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Impact Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Top Events by Impact */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Events by Price Impact</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlations.slice(0, 8)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="event_type" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="price_change_percent" 
                  fill={(data: any) => data.price_change_percent >= 0 ? '#10b981' : '#ef4444'}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot - Impact vs Magnitude */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Impact Magnitude vs Price Change</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Impact Magnitude" 
                  stroke="#6b7280"
                  fontSize={10}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Price Change %" 
                  stroke="#6b7280"
                  fontSize={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter 
                  data={scatterData} 
                  fill="#3b82f6"
                  opacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Impact Events Table */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top 5 Events by Impact</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Change
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {correlations.slice(0, 5).map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {new Date(event.event_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {event.event_type}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.price_change_percent >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {event.price_change_percent >= 0 ? '+' : ''}{event.price_change_percent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-xs">
                    {event.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 