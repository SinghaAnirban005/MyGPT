'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Menu,
  X,
  Paperclip,
  Search,
  BookOpen,
  Mic,
  FileText,
  Lightbulb,
  MessageSquare,
  Code,
  Smile,
  MoreHorizontal,
  HelpCircle,
} from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

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
      <div className="flex min-h-screen flex-col bg-neutral-800 text-white">
        <header className="flex items-center justify-end px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="rounded-full border-gray-600 bg-white text-black hover:bg-gray-200"
              onClick={() => router.push('/sign-in')}
            >
              Log in
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700 hover:text-white focus:text-white"
              onClick={() => router.push('/sign-up')}
            >
              Sign up for free
            </Button>

            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-neutral-700 rounded-full">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-medium">ChatGPT</h2>
          </div>

          <div className="w-full max-w-3xl">
            <Card className="rounded-2xl border-neutral-800 bg-neutral-700">
              <CardContent className="p-0">
                <div className="relative">
                  <Textarea
                    placeholder="Ask anything"
                    className="max-h-[200px] min-h-[60px] w-full resize-none border-none bg-transparent px-4 pt-4 pb-14 text-base leading-relaxed text-white placeholder-gray-400 outline-none focus-visible:ring-0"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  />

                  <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-200"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-200"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-200"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="absolute right-3 bottom-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-200"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 mb-8 flex flex-wrap justify-center gap-3">
              {[
                { icon: FileText, label: 'Summarize text', color: 'text-orange-400' },
                { icon: Lightbulb, label: 'Brainstorm', color: 'text-yellow-400' },
                { icon: MessageSquare, label: 'Get advice', color: 'text-blue-400' },
                { icon: Code, label: 'Code', color: 'text-purple-400' },
                { icon: Smile, label: 'Surprise me', color: 'text-green-400' },
                { icon: MoreHorizontal, label: 'More', color: 'text-gray-400' },
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="flex items-center space-x-2 rounded-full border-gray-600 bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700"
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-gray-500">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 text-center">
          <p className="text-sm text-gray-400">
            By messaging ChatGPT, you agree to our{' '}
            <Button variant="link" className="h-auto p-0 text-gray-300 hover:text-white">
              Terms
            </Button>{' '}
            and have read our{' '}
            <Button variant="link" className="h-auto p-0 text-gray-300 hover:text-white">
              Privacy Policy
            </Button>
            . See{' '}
            <Button variant="link" className="h-auto p-0 text-gray-300 hover:text-white">
              Cookie Preferences
            </Button>
            .
          </p>
        </footer>
      </div>
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
              <Card className="border-neutral-700 bg-neutral-800">
                <CardContent className="p-6 text-center">
                  <h2 className="mb-4 text-xl font-semibold">Welcome to ChatGPT</h2>
                  <p className="mb-4 text-gray-400">Start a new conversation to begin chatting.</p>
                  <Button onClick={createNewChat} className="bg-green-600 hover:bg-green-700">
                    Start New Chat
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
