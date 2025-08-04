'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, MapPin, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

const API_BASE_URL = 'http://localhost:5000/api/analysis'

interface EventsTimelineProps {
  filters: {
    startDate: string
    endDate: string
    eventType: string
    showEvents: boolean
    showChangePoints: boolean
  }
}

interface Event {
  Date: string
  Event_Type: string
  Description: string
  Location?: string
  Impact?: string
}

export default function EventsTimeline({ filters }: EventsTimelineProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [filters.startDate, filters.endDate, filters.eventType])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.startDate) params.append('start_date', filters.startDate)
      if (filters.endDate) params.append('end_date', filters.endDate)
      if (filters.eventType) params.append('event_type', filters.eventType)

      const response = await axios.get(`${API_BASE_URL}/events?${params}`)
      setEvents(response.data.events || [])
      setError(null)
    } catch (err) {
      setError('Failed to load events data')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    const type = eventType.toLowerCase()
    if (type.includes('conflict') || type.includes('war')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    } else if (type.includes('economic') || type.includes('sanction')) {
      return <TrendingDown className="h-4 w-4 text-orange-500" />
    } else if (type.includes('agreement') || type.includes('deal')) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    }
    return <Calendar className="h-4 w-4 text-blue-500" />
  }

  const getEventColor = (eventType: string) => {
    const type = eventType.toLowerCase()
    if (type.includes('conflict') || type.includes('war')) {
      return 'border-red-200 bg-red-50'
    } else if (type.includes('economic') || type.includes('sanction')) {
      return 'border-orange-200 bg-orange-50'
    } else if (type.includes('agreement') || type.includes('deal')) {
      return 'border-green-200 bg-green-50'
    }
    return 'border-blue-200 bg-blue-50'
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
            onClick={fetchEvents}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No events found for the selected filters</p>
      </div>
    )
  }

  return (
    <div className="h-96 overflow-y-auto">
      <div className="space-y-4">
        {events.map((event, index) => (
          <div
            key={index}
            className={`relative p-4 rounded-lg border-l-4 ${getEventColor(event.Event_Type)}`}
          >
            {/* Timeline connector */}
            {index < events.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
            )}

            <div className="flex items-start space-x-3">
              {/* Event icon */}
              <div className="flex-shrink-0 mt-1">
                {getEventIcon(event.Event_Type)}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {event.Event_Type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.Date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  {event.Description}
                </p>

                {event.Location && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.Location}
                  </div>
                )}

                {event.Impact && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Impact: {event.Impact}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Events: {events.length}</span>
          <span>
            {new Date(events[0]?.Date).toLocaleDateString()} - {new Date(events[events.length - 1]?.Date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
} 