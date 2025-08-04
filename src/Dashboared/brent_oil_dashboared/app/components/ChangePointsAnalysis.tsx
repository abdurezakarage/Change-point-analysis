'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Target, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5000/api/analysis'

interface ChangePoint {
  date: string
  confidence: number
  segment_start: string
  segment_end: string
  mean_before: number
  mean_after: number
  change_type: string
}

interface Segment {
  start_date: string
  end_date: string
  mean_price: number
  volatility: number
  trend: string
}

export default function ChangePointsAnalysis() {
  const [changePoints, setChangePoints] = useState<ChangePoint[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [modelPerformance, setModelPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChangePointsData()
  }, [])

  const fetchChangePointsData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/change-points`)
      
      // Ensure change_points is always an array
      const changePointsData = response.data.change_points
      if (Array.isArray(changePointsData)) {
        setChangePoints(changePointsData)
      } else {
        console.warn('change_points is not an array:', changePointsData)
        setChangePoints([])
      }
      
      // Ensure segments is always an array
      const segmentsData = response.data.segments
      if (Array.isArray(segmentsData)) {
        setSegments(segmentsData)
      } else {
        console.warn('segments is not an array:', segmentsData)
        setSegments([])
      }
      
      setModelPerformance(response.data.model_performance || {})
      setError(null)
    } catch (err) {
      setError('Failed to load change points data')
      console.error('Error fetching change points:', err)
      // Reset to empty arrays on error
      setChangePoints([])
      setSegments([])
      setModelPerformance({})
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchChangePointsData}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!Array.isArray(changePoints) || changePoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No change points detected</p>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-purple-600">
            Price: ${payload[0].value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {/* Model Performance Summary */}
      {modelPerformance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-600">Change Points Detected</p>
                <p className="text-lg font-semibold text-purple-900">{changePoints.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Model Accuracy</p>
                <p className="text-lg font-semibold text-blue-900">
                  {modelPerformance.accuracy ? `${(modelPerformance.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Segments Identified</p>
                <p className="text-lg font-semibold text-green-900">{segments.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Points Timeline */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Detected Change Points</h4>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {changePoints.map((point, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    point.change_type === 'increase' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(point.date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  point.change_type === 'increase' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {point.change_type === 'increase' ? 'Price Increase' : 'Price Decrease'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <p>Before: ${point.mean_before.toFixed(2)}</p>
                  <p>After: ${point.mean_after.toFixed(2)}</p>
                </div>
                <div>
                  <p>Change: {((point.mean_after - point.mean_before) / point.mean_before * 100).toFixed(1)}%</p>
                  <p>Confidence: {(point.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segments Analysis */}
      {Array.isArray(segments) && segments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Segments Analysis</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mean Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volatility
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segments.map((segment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(segment.start_date).toLocaleDateString()} - {new Date(segment.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      ${segment.mean_price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {(segment.volatility * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        segment.trend === 'increasing' 
                          ? 'bg-green-100 text-green-800' 
                          : segment.trend === 'decreasing'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {segment.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p>Analysis detected {changePoints.length} significant structural changes in Brent oil prices.</p>
          <p>Average confidence level: {Array.isArray(changePoints) && changePoints.length > 0 
            ? (changePoints.reduce((sum, p) => sum + p.confidence, 0) / changePoints.length * 100).toFixed(1)
            : '0.0'}%</p>
        </div>
      </div>
    </div>
  )
} 