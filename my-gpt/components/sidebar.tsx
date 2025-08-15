"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  MessageSquare, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Share2, 
  Check, 
  X,
  Copy,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatSummary {
  id: string
  title: string
  isShared: boolean
  shareToken?: string
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
  messageCount: number
}

interface ChatSidebarProps {
  currentChatId?: string
  onChatSelect: (chatId: string) => void
  onNewChat?: () => void
}

export function Sidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { user } = useUser()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadChats()
    }
  }, [user])

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats')
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setChats(prev => [data.chat, ...prev])
        onChatSelect(data.chat.id)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setChats(prev => prev.filter(chat => chat.id !== chatId))
        if (currentChatId === chatId) {
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const startEditing = (chat: ChatSummary) => {
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const saveTitle = async (chatId: string) => {
    if (!editingTitle.trim()) return
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editingTitle.trim() }),
      })
      
      if (response.ok) {
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        ))
      }
    } catch (error) {
      console.error('Error updating title:', error)
    } finally {
      setEditingChatId(null)
      setEditingTitle('')
    }
  }

  const cancelEditing = () => {
    setEditingChatId(null)
    setEditingTitle('')
  }

  const shareChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/share`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        setShareUrl(data.shareUrl)
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, isShared: true, shareToken: data.shareToken }
            : chat
        ))
        
        // Copy to clipboard
        navigator.clipboard.writeText(data.shareUrl)
        
        // Clear after 3 seconds
        setTimeout(() => setShareUrl(null), 3000)
      }
    } catch (error) {
      console.error('Error sharing chat:', error)
    }
  }

  const unshareChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/share`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, isShared: false, shareToken: undefined }
            : chat
        ))
      }
    } catch (error) {
      console.error('Error unsharing chat:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button 
          onClick={createNewChat}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => editingChatId !== chat.id && onChatSelect(chat.id)}
                >
                  {editingChatId === chat.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveTitle(chat.id)
                          } else if (e.key === 'Escape') {
                            cancelEditing()
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => saveTitle(chat.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate mb-1">
                            {chat.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{chat.messageCount} messages</span>
                            {chat.isShared && (
                              <Share2 className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDate(chat.lastMessageAt || chat.updatedAt)}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(chat)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {chat.isShared ? (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (chat.shareToken) {
                                      const url = `${window.location.origin}/share/${chat.shareToken}`
                                      navigator.clipboard.writeText(url)
                                    }
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => unshareChat(chat.id)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Unshare
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => shareChat(chat.id)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteChat(chat.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {shareUrl && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            Link copied to clipboard!
          </div>
        </div>
      )}
    </div>
  )
}