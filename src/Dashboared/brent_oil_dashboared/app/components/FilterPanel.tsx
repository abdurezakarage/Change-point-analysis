'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Filter, Calendar, X } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5000/api/analysis'

interface FilterPanelProps {
  filters: {
    startDate: string
    endDate: string
    eventType: string
    showEvents: boolean
    showChangePoints: boolean
  }
  onFiltersChange: (filters: any) => void
}

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const fetchEventTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`)
      setEventTypes(response.data.event_types || [])
    } catch (error) {
      console.error('Error fetching event types:', error)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      startDate: '',
      endDate: '',
      eventType: '',
      showEvents: true,
      showChangePoints: true
    })
  }

  const hasActiveFilters = filters.startDate || filters.endDate || filters.eventType

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Events</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showEvents}
                onChange={(e) => handleFilterChange('showEvents', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show Events</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showChangePoints}
                onChange={(e) => handleFilterChange('showChangePoints', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show Change Points</span>
            </label>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Active filters: 
            {filters.startDate && ` From ${filters.startDate}`}
            {filters.endDate && ` To ${filters.endDate}`}
            {filters.eventType && ` Event: ${filters.eventType}`}
          </p>
        </div>
      )}
    </div>
  )
} 