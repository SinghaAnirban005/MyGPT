'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
        setChatUpdateTrigger((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error creating new chat:', error)
    }
  }

  const handleChatUpdate = () => {
    setChatUpdateTrigger((prev) => prev + 1)
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen">
        <div className="hidden md:block">
          <Skeleton className="h-full w-[260px] border-r bg-neutral-900" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-8 w-8 rounded-full bg-neutral-900" />
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      // <div className="flex h-screen items-center justify-center bg-white">
      //   <div className="max-w-md p-4 text-center text-white">
      //     <h2 className="mb-2 text-xl font-semibold">Please Sign In</h2>
      //     <p className="mb-4 text-gray-400">You need to be signed in to use the chat.</p>
      //     <Button
      //       onClick={() => (window.location.href = '/sign-in')}
      //       className="bg-green-600 hover:bg-green-700"
      //     >
      //       Sign In
      //     </Button>
      //   </div>
      // </div>
      <div>anirba</div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-800 text-gray-100">
      <Sidebar
        key={chatUpdateTrigger}
        currentChatId={currentChatId}
        onChatSelect={(id) => {
          setCurrentChatId(id)
          setSidebarOpen(false)
        }}
        onNewChat={createNewChat}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gray-700 p-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-300 hover:bg-gray-800"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-lg font-semibold">ChatGPT</h1>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentChatId ? (
            <Chat key={currentChatId} chatId={currentChatId} onChatUpdate={handleChatUpdate} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md p-4 text-center text-gray-400">
                <h2 className="mb-4 text-xl font-semibold">Welcome to ChatGPT</h2>
                <p className="mb-4">Start a new conversation to begin chatting.</p>
                <Button onClick={createNewChat} className="bg-green-600 hover:bg-green-700">
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
