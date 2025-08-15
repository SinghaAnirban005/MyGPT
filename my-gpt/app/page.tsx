"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Sidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0)


  useEffect(() => {
    console.log('current chat id -> ', currentChatId)
  }, [currentChatId])

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
        setCurrentChatId(data.chat.id)
        setChatUpdateTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error creating new chat:', error)
    }
  }

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  // const handleNewChat = () => {
  //   // createNewChat()
  // }

  const handleChatUpdate = () => {
    setChatUpdateTrigger(prev => prev + 1)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-4">You need to be signed in to use the chat with memory features.</p>
          <Button onClick={() => window.location.href = '/sign-in'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed lg:relative lg:translate-x-0 z-50 lg:z-0
        transition-transform duration-200 ease-in-out
        h-full
      `}>
        <Sidebar
          key={chatUpdateTrigger} // Force re-render when chats update
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-lg font-semibold">Chat</h1>
          <div />
        </div>

        <div className="flex-1">
          {currentChatId ? (
            <Chat 
              key={currentChatId} // Force re-render when chat changes
              chatId={currentChatId} 
              onChatUpdate={handleChatUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Welcome to your AI Chat</h2>
                <p className="text-gray-600 mb-4">Start a new conversation to begin chatting with memory-enhanced AI.</p>
                <Button onClick={createNewChat}>
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}