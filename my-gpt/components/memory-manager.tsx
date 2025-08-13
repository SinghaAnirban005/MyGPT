'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Brain, Trash2, RefreshCw, User, Heart, MessageCircle, AlertCircle } from 'lucide-react'

interface Memory {
  id: string
  memory: string
  type: 'fact' | 'preference' | 'context'
  timestamp: string
}

interface MemoryData {
  memories: Memory[]
  total: number
  userId: string
}

export function MemoryManager() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMemories = async () => {
    if (!isSignedIn) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/memory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setMemoryData(data)
      } else if (response.status === 401) {
        setError('Please sign in to view memories')
      } else {
        setError('Failed to fetch memories')
      }
    } catch (error) {
      console.error('Error fetching memories:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const clearAllMemories = async () => {
    if (!isSignedIn) return
    
    if (!confirm('Are you sure you want to clear all memories? This cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/memory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        setMemoryData({ memories: [], total: 0, userId: user?.id || '' })
      } else if (response.status === 401) {
        setError('Please sign in to clear memories')
      } else {
        setError('Failed to clear memories')
      }
    } catch (error) {
      console.error('Error clearing memories:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMemories()
    }
  }, [isLoaded, isSignedIn])

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'fact':
        return <User className="h-3 w-3" />
      case 'preference':
        return <Heart className="h-3 w-3" />
      case 'context':
        return <MessageCircle className="h-3 w-3" />
      default:
        return <Brain className="h-3 w-3" />
    }
  }

  const getMemoryColor = (type: string) => {
    switch (type) {
      case 'fact':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'preference':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
      case 'context':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (!isLoaded) {
    return (
      <div className="w-full max-w-2xl">
        <div className="p-6">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="w-full max-w-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Memory Management
          </div>
        </div>
        <div>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-gray-600 mb-4">
              Please sign in to view and manage your conversation memories.
            </p>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl">
      <div>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          Memory Management
          {memoryData && (
            <div className="ml-auto">
              {memoryData.total} memories
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Managing memories for:</span>
            <div>
              {user.firstName} {user.lastName}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={fetchMemories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={clearAllMemories} 
            disabled={loading || !memoryData?.memories.length}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>
      <div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading memories...</p>
          </div>
        ) : !memoryData?.memories.length ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Memories Yet</h3>
            <p className="text-gray-500 mb-4">
              Start chatting to build your personalized memory! The AI will remember your preferences, 
              facts about you, and conversation context.
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              <div className="text-center p-2">
                <div className="flex items-center justify-center mb-1">
                  <User className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs text-gray-600">Facts</div>
              </div>
              <div className="text-center p-2">
                <div className="flex items-center justify-center mb-1">
                  <Heart className="h-4 w-4 text-pink-500" />
                </div>
                <div className="text-xs text-gray-600">Preferences</div>
              </div>
              <div className="text-center p-2">
                <div className="flex items-center justify-center mb-1">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-xs text-gray-600">Context</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {['fact', 'preference', 'context'].map(type => {
              const memoriesOfType = memoryData.memories.filter(memory => memory.type === type)
              if (memoriesOfType.length === 0) return null

              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    {getMemoryIcon(type)}
                    <h4 className="text-sm font-semibold capitalize">{type}s</h4>
                    <div className="text-xs">
                      {memoriesOfType.length}
                    </div>
                  </div>
                  <div className="space-y-2 ml-5">
                    {memoriesOfType.map((memory) => (
                      <div 
                        key={memory.id} 
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 text-gray-900 dark:text-gray-100">
                            {memory.memory}
                          </div>
                          <div 
                            className={`text-xs shrink-0 ${getMemoryColor(memory.type)}`}
                          >
                            {memory.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {memoryData?.memories.length ? (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 text-center">
              Total: {memoryData.total} memories stored for your account
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}