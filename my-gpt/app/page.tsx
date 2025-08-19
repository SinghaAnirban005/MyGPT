// app/page.tsx
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
  ArrowUp,
} from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { Skeleton } from '@/components/ui/skeleton'
import { InputOptions } from '@/components/input-options'
import { useRouter } from 'next/navigation'
import { getFileType, getFileIcon, getFileColor } from '@/components/file-utilities'
import { FileData } from '@/lib/file-data'

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([])
  const [isCreatingChat, setIsCreatingChat] = useState(false)
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
        return data.chat.id
      }
    } catch (error) {
      console.error('Error creating new chat:', error)
    }
    return null
  }

  const handleChatUpdate = () => {
    setChatUpdateTrigger((prev) => prev + 1)
  }

  const handleFileUpload = (fileData: FileData) => {
    setAttachedFiles((prev) => [...prev, fileData])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const sendInitialMessage = async (chatId: string, message: string, files: FileData[] = []) => {
    try {
      // First save the user message
      const userMessageData = {
        text: message,
        files:
          files.length > 0
            ? files.map((file) => ({
                type: 'file',
                mediaType: file.mimeType,
                filename: file.name,
                url: file.cdnUrl,
              }))
            : undefined,
      }

      const existingResponse = await fetch(`/api/chats/${chatId}`)
      let existingMessages = []

      if (existingResponse.ok) {
        const chatData = await existingResponse.json()
        existingMessages = chatData.chat?.messages || []
      }

      const formattedUserMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessageData.text || '',
        parts: [
          { type: 'text', text: userMessageData.text || '' },
          ...(userMessageData.files?.map((file) => ({
            type: 'file',
            file: {
              type: 'file',
              mediaType: file.mediaType,
              name: file.filename,
              url: file.url,
            },
          })) || []),
        ],
        timestamp: new Date(),
      }

      const allMessages = [...existingMessages, formattedUserMessage]

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
          title: message.length > 50 ? message.substring(0, 50) + '...' : message || 'New Chat',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save initial message: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending initial message:', error)
    }
  }

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const text = input.trim()
    if ((!text && attachedFiles.length === 0) || isCreatingChat) return

    setIsCreatingChat(true)
    
    try {
      // Create new chat
      const newChatId = await createNewChat()
      
      if (newChatId && (text || attachedFiles.length > 0)) {
        // Send the initial message
        await sendInitialMessage(newChatId, text, attachedFiles)
        
        // Clear the input and files
        setInput('')
        setAttachedFiles([])
        
        // Update chat trigger to refresh sidebar
        setChatUpdateTrigger((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error creating chat with message:', error)
    } finally {
      setIsCreatingChat(false)
    }
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
            <div className="flex h-full flex-col items-center justify-center bg-neutral-800">

              <div className="mb-8 text-center">
                <h1 className="text-3xl font-normal text-white">Ready when you are.</h1>
              </div>

              <div className="w-full max-w-2xl px-4">
                <form onSubmit={handleInputSubmit}>
                  {attachedFiles.length > 0 && (
                    <div className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                      {attachedFiles.map((file, index) => {
                        const fileType = getFileType(file.mimeType)

                        return (
                          <div key={index} className="group relative">
                            {fileType === 'image' ? (
                              <div className="relative">
                                <img
                                  src={file.url || file.cdnUrl}
                                  alt={file.name}
                                  className="h-16 w-16 rounded-md border-2 border-gray-600 object-cover"
                                />
                                <div className="bg-opacity-0 group-hover:bg-opacity-30 absolute inset-0 flex items-center justify-center rounded-md bg-black transition-all">
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="rounded-full bg-red-500 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`h-16 w-20 rounded-md border-2 ${getFileColor(fileType)} group-hover:bg-opacity-20 relative flex flex-col items-center justify-center p-1 transition-all`}
                              >
                                {getFileIcon(fileType, 'h-5 w-5')}
                                <span
                                  className="mt-1 w-full truncate text-center text-xs text-gray-300"
                                  title={file.name}
                                >
                                  {file.name.length > 8 ? file.name.substring(0, 6) + '...' : file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="relative flex items-center rounded-full bg-neutral-700 px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <InputOptions onFileUpload={handleFileUpload} />
                    </div>

                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything"
                      className="flex-1 bg-transparent px-3 text-white placeholder-gray-400 outline-none"
                      disabled={isCreatingChat}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if ((input.trim() || attachedFiles.length > 0) && !isCreatingChat) {
                            handleInputSubmit(e)
                          }
                        }
                      }}
                    />

                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white rounded-full hover:text-white hover:bg-neutral-600"
                        disabled={isCreatingChat}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={isCreatingChat || (input.trim() === '' && attachedFiles.length === 0)}
                        className="h-8 w-8 rounded-full bg-white p-0 text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400"
                      >
                        {isCreatingChat ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    ChatGPT can make mistakes. Check important info. See{' '}
                    <button className="text-gray-400 underline hover:text-gray-300">
                      Cookie Preferences
                    </button>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}