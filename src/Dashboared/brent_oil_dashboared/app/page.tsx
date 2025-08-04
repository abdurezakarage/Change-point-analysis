'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Activity, Calendar, BarChart3, Target, AlertTriangle } from 'lucide-react'
import PriceChart from './components/PriceChart'
import VolatilityChart from './components/VolatilityChart'
import EventsTimeline from './components/EventsTimeline'
import CorrelationAnalysis from './components/CorrelationAnalysis'
import ChangePointsAnalysis from './components/ChangePointsAnalysis'
import FilterPanel from './components/FilterPanel'
import LoadingSpinner from './components/LoadingSpinner'

const API_BASE_URL = 'http://localhost:5000/api/analysis'

interface DashboardSummary {
  current_price: number
  price_changes: {
    '1d': number
    '1w': number
    '1m': number
  }
  statistics: {
    total_data_points: number
    date_range: {
      start: string
      end: string
    }
    price_range: {
      min: number
      max: number
      avg: number
    }
  }
  events_summary: {
    total_events: number
    event_types: Record<string, number>
  }
  analysis_status: {
    change_points_detected: number
    model_performance: any
  }
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    eventType: '',
    showEvents: true,
    showChangePoints: true
  })

  useEffect(() => {
    fetchDashboardSummary()
  }, [])

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/dashboard-summary`)
      setSummary(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Error fetching dashboard summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardSummary}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Brent Oil Analysis Dashboard</h1>
              <p className="text-gray-600 mt-1">Interactive analysis of Brent oil price trends and correlations</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Price</p>
                <p className="text-2xl font-bold text-gray-900">${summary.current_price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Price Change Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">1 Day Change</p>
                <div className="flex items-center">
                  {summary.price_changes['1d'] >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <p className={`text-lg font-semibold ${summary.price_changes['1d'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.price_changes['1d'].toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">1 Week Change</p>
                <div className="flex items-center">
                  {summary.price_changes['1w'] >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <p className={`text-lg font-semibold ${summary.price_changes['1w'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.price_changes['1w'].toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">1 Month Change</p>
                <div className="flex items-center">
                  {summary.price_changes['1m'] >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <p className={`text-lg font-semibold ${summary.price_changes['1m'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.price_changes['1m'].toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterPanel filters={filters} onFiltersChange={setFilters} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Trend Analysis</h2>
            <PriceChart filters={filters} />
          </div>

          {/* Volatility Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Volatility Analysis</h2>
            <VolatilityChart filters={filters} />
          </div>
        </div>

        {/* Events and Change Points */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Events Timeline */}
          {filters.showEvents && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Events Timeline</h2>
              <EventsTimeline filters={filters} />
            </div>
          )}

          {/* Change Points Analysis */}
          {filters.showChangePoints && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Points Analysis</h2>
              <ChangePointsAnalysis />
            </div>
          )}
        </div>

        {/* Correlation Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Impact Analysis</h2>
          <CorrelationAnalysis filters={filters} />
        </div>

        {/* Statistics Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Price Statistics</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Min: ${summary.statistics.price_range.min.toFixed(2)}</p>
                <p>Max: ${summary.statistics.price_range.max.toFixed(2)}</p>
                <p>Average: ${summary.statistics.price_range.avg.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Data Coverage</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Total Records: {summary.statistics.total_data_points.toLocaleString()}</p>
                <p>Date Range: {summary.statistics.date_range.start} to {summary.statistics.date_range.end}</p>
                <p>Change Points: {summary.analysis_status.change_points_detected}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Events Summary</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Total Events: {summary.events_summary.total_events}</p>
                <p>Event Types: {Object.keys(summary.events_summary.event_types).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
