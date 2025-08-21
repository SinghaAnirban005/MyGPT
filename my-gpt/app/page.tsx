'use client'

import { useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useChat } from '@ai-sdk/react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([])
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentChatIdRef = useRef(currentChatId)
  currentChatIdRef.current = currentChatId

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const chatHook = useChat({
    onFinish: async (message: any) => {
      const currentId = currentChatIdRef.current
      if (currentId) {
        await saveAssistantMessage(currentId, message)
        setChatUpdateTrigger((prev) => prev + 1)
      } else {
        console.error('Cannot save assistant message: currentChatId is empty')
      }
    },

    onError: (error: any) => {
      console.error('Chat error:', error)
      if (error.message.includes('Unauthorized')) {
        window.location.href = '/sign-in'
      }
    },
  })

  const { sendMessage: sendAIMessage, status } = chatHook

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

  const saveAssistantMessage = async (chatId: string, assistantMessage: any) => {
    try {
      console.log('Saving assistant message for chat:', chatId)

      const existingResponse = await fetch(`/api/chats/${chatId}`)
      let existingMessages = []

      if (existingResponse.ok) {
        const chatData = await existingResponse.json()
        existingMessages = chatData.chat?.messages || []
      }

      const messageObj = assistantMessage.message || assistantMessage

      const formattedAssistantMessage = {
        id: messageObj.id,
        role: messageObj.role,
        content: Array.isArray(messageObj.parts)
          ? messageObj.parts
              .filter((p: any) => p.type === 'text' && p.text)
              .map((p: any) => p.text)
              .join('') || ''
          : typeof messageObj.content === 'string'
            ? messageObj.content
            : '',
        parts: messageObj.parts || [{ type: 'text', text: messageObj.content }],
        timestamp: new Date(),
      }

      const allMessages = [...existingMessages, formattedAssistantMessage]

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save assistant message: ${response.statusText}`)
      }

      console.log('Assistant message saved successfully')
      return allMessages
    } catch (error) {
      console.error('Error saving assistant message:', error)
      throw error
    }
  }

  const sendInitialMessage = async (chatId: string, message: string, files: FileData[] = []) => {
    try {
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

      if (files.length > 0) {
        await sendAIMessage({
          text: message,
          files: files.map((file) => ({
            type: 'file' as const,
            mediaType: file.mimeType,
            filename: file.name,
            url: file.cdnUrl,
          })),
        })
      } else {
        await sendAIMessage({
          text: message,
        })
      }
    } catch (error) {
      console.error('Error sending initial message:', error)
    }
  }

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const text = input.trim()
    if ((!text && attachedFiles.length === 0) || isCreatingChat || status === 'streaming') return

    setIsCreatingChat(true)

    try {
      const newChatId = await createNewChat()

      if (newChatId && (text || attachedFiles.length > 0)) {
        await sendInitialMessage(newChatId, text, attachedFiles)
        setInput('')
        setAttachedFiles([])

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }

        setChatUpdateTrigger((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error creating chat with message:', error)
    } finally {
      setIsCreatingChat(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustTextareaHeight()
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen">
        <div className="hidden lg:block">
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
        <header className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-neutral-700 sm:h-10 sm:w-10"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* This empty div pushes the buttons to the right */}
          <div className="flex-1"></div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="outline"
              className="h-8 rounded-full border-gray-600 bg-white px-3 text-xs text-black hover:bg-gray-200 sm:h-9 sm:px-4 sm:text-sm"
              onClick={() => router.push('/sign-in')}
            >
              Log in
            </Button>
            <Button
              variant="outline"
              className="hidden h-9 rounded-full border-neutral-700 bg-neutral-800 px-4 text-sm text-white hover:bg-neutral-700 hover:text-white focus:text-white sm:inline-flex"
              onClick={() => router.push('/sign-up')}
            >
              Sign up for free
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-neutral-700 hover:text-white sm:h-10 sm:w-10"
            >
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 text-3xl font-medium sm:text-4xl">ChatGPT</h2>
          </div>

          <div className="w-full max-w-xs sm:max-w-2xl md:max-w-3xl">
            <Card className="rounded-xl border-neutral-800 bg-neutral-700 sm:rounded-2xl">
              <CardContent className="p-0">
                <div className="relative">
                  <Textarea
                    placeholder="Ask anything"
                    className="max-h-[120px] min-h-[40px] w-full resize-none border-none bg-transparent px-5 pb-14 text-sm leading-relaxed text-white placeholder-gray-400 outline-none focus-visible:ring-0 sm:max-h-[200px] sm:min-h-[50px] sm:pb-16 sm:text-base"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  />

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-gray-400 hover:bg-neutral-600 hover:text-gray-200 sm:h-8 sm:w-8"
                    >
                      <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-gray-400 hover:bg-neutral-600 hover:text-gray-200 sm:h-8 sm:w-8"
                    >
                      <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-gray-400 hover:bg-neutral-600 hover:text-gray-200 sm:h-8 sm:w-8"
                    >
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <div className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-gray-400 hover:bg-neutral-600 hover:text-gray-200 sm:h-8 sm:w-8"
                    >
                      <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 mb-6 flex flex-wrap justify-center gap-2 sm:mt-6 sm:mb-8 sm:gap-3">
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
                  className="flex items-center space-x-1.5 rounded-full border-gray-600 bg-neutral-800 px-3 py-1.5 text-xs font-medium hover:bg-neutral-700 sm:space-x-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <item.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${item.color}`} />
                  <span className="text-gray-500">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <footer className="px-4 py-3 text-center sm:px-6 sm:py-4">
          <p className="text-xs text-gray-400 sm:text-sm">
            By messaging ChatGPT, you agree to our{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-gray-300 hover:text-white sm:text-sm"
            >
              Terms
            </Button>{' '}
            and have read our{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-gray-300 hover:text-white sm:text-sm"
            >
              Privacy Policy
            </Button>
            <span className="hidden sm:inline">
              . See{' '}
              <Button variant="link" className="h-auto p-0 text-sm text-gray-300 hover:text-white">
                Cookie Preferences
              </Button>
            </span>
            .
          </p>
        </footer>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-800 text-gray-100">
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <Sidebar
          key={chatUpdateTrigger}
          currentChatId={currentChatId}
          onChatSelect={setCurrentChatId}
          onNewChat={createNewChat}
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-gray-700 p-3 sm:p-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 text-gray-300 hover:bg-gray-800"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <h1 className="text-base font-semibold sm:text-lg">ChatGPT</h1>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentChatId ? (
            <Chat
              key={currentChatId}
              chatId={currentChatId}
              onChatUpdate={handleChatUpdate}
              useChatHook={chatHook}
            />
          ) : (
            <div className="flex h-full flex-col bg-neutral-800">
              {status === 'streaming' && (
                <div className="flex justify-center p-4">
                  <div className="rounded-lg bg-neutral-700 p-3 sm:p-4">
                    <div className="animate-pulse text-sm text-gray-100 sm:text-base">
                      AI is thinking...
                    </div>
                  </div>
                </div>
              )}

              <div className="hidden flex-1 items-center justify-center px-6 md:flex">
                <div className="w-full max-w-3xl text-center">
                  <div className="mb-8">
                    <h1 className="text-4xl font-normal text-white">Ready when you are.</h1>
                  </div>

                  <form onSubmit={handleInputSubmit}>
                    {attachedFiles.length > 0 && (
                      <div className="mb-3 flex max-h-32 flex-wrap justify-center gap-2 overflow-y-auto">
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
                                    {file.name.length > 6
                                      ? file.name.substring(0, 4) + '..'
                                      : file.name}
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

                    <div className="relative flex items-end rounded-3xl bg-neutral-700 p-3 shadow-sm">
                      <div className="flex shrink-0 items-center space-x-2 pb-1">
                        <InputOptions onFileUpload={handleFileUpload} />
                      </div>

                      <div className="mx-3 min-w-0 flex-1">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={handleInputChange}
                          placeholder="Ask anything"
                          className="max-h-[120px] min-h-[20px] w-full resize-none bg-transparent py-2 text-base text-white placeholder-gray-400 outline-none"
                          disabled={isCreatingChat || status === 'streaming'}
                          rows={1}
                          style={{
                            height: 'auto',
                            lineHeight: '1.5',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              if (
                                (input.trim() || attachedFiles.length > 0) &&
                                !isCreatingChat &&
                                status !== 'streaming'
                              ) {
                                handleInputSubmit(e)
                              }
                            }
                          }}
                        />
                      </div>

                      <div className="flex shrink-0 items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mb-1 h-8 w-8 rounded-full text-white transition-colors hover:bg-neutral-600 hover:text-white"
                          disabled={isCreatingChat || status === 'streaming'}
                        >
                          <Mic className="h-4 w-4" />
                        </Button>

                        <Button
                          type="submit"
                          disabled={
                            isCreatingChat ||
                            status === 'streaming' ||
                            (input.trim() === '' && attachedFiles.length === 0)
                          }
                          className={`mb-1 h-8 w-8 shrink-0 rounded-full p-0 transition-colors ${
                            (input.trim() || attachedFiles.length > 0) &&
                            !isCreatingChat &&
                            status !== 'streaming'
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'cursor-not-allowed bg-gray-600 text-gray-400'
                          }`}
                        >
                          {isCreatingChat || status === 'streaming' ? (
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

                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        ChatGPT can make mistakes. Check important info. See{' '}
                        <button className="text-gray-400 underline hover:text-gray-300">
                          Cookie Preferences
                        </button>
                        .
                      </p>
                    </div>
                  </form>
                </div>
              </div>

              <div className="flex h-full flex-col md:hidden">
                <div className="flex flex-1 items-center justify-center px-4 sm:px-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-normal text-white sm:text-3xl">
                      Ready when you are.
                    </h1>
                  </div>
                </div>

                <div className="w-full px-3 pb-4 sm:px-4 sm:pb-6">
                  <div className="mx-auto max-w-full sm:max-w-2xl">
                    <form onSubmit={handleInputSubmit}>
                      {attachedFiles.length > 0 && (
                        <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto sm:max-h-32">
                          {attachedFiles.map((file, index) => {
                            const fileType = getFileType(file.mimeType)

                            return (
                              <div key={index} className="group relative">
                                {fileType === 'image' ? (
                                  <div className="relative">
                                    <img
                                      src={file.url || file.cdnUrl}
                                      alt={file.name}
                                      className="h-12 w-12 rounded-md border-2 border-gray-600 object-cover sm:h-16 sm:w-16"
                                    />
                                    <div className="bg-opacity-0 group-hover:bg-opacity-30 absolute inset-0 flex items-center justify-center rounded-md bg-black transition-all">
                                      <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="rounded-full bg-red-500 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 sm:p-1"
                                      >
                                        <X className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={`h-12 w-16 rounded-md border-2 sm:h-16 sm:w-20 ${getFileColor(fileType)} group-hover:bg-opacity-20 relative flex flex-col items-center justify-center p-1 transition-all`}
                                  >
                                    {getFileIcon(fileType, 'h-4 w-4 sm:h-5 sm:w-5')}
                                    <span
                                      className="mt-0.5 w-full truncate text-center text-xs text-gray-300 sm:mt-1"
                                      title={file.name}
                                    >
                                      {file.name.length > 6
                                        ? file.name.substring(0, 4) + '..'
                                        : file.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(index)}
                                      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 sm:-top-2 sm:-right-2 sm:p-1"
                                    >
                                      <X className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="relative flex items-end rounded-2xl bg-neutral-700 p-2 shadow-sm sm:rounded-3xl sm:p-3">
                        <div className="flex shrink-0 items-center space-x-1 sm:space-x-2">
                          <InputOptions onFileUpload={handleFileUpload} />
                        </div>

                        <div className="mx-2 min-w-0 flex-1 sm:mx-3">
                          <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask anything"
                            className="max-h-[100px] min-h-[20px] w-full resize-none bg-transparent py-1 text-sm text-white placeholder-gray-400 outline-none sm:max-h-[120px] sm:py-2 sm:text-base"
                            disabled={isCreatingChat || status === 'streaming'}
                            rows={1}
                            style={{
                              height: 'auto',
                              lineHeight: '1.5',
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (
                                  (input.trim() || attachedFiles.length > 0) &&
                                  !isCreatingChat &&
                                  status !== 'streaming'
                                ) {
                                  handleInputSubmit(e)
                                }
                              }
                            }}
                          />
                        </div>

                        <div className="flex shrink-0 items-center space-x-1 sm:space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-white transition-colors hover:bg-neutral-600 hover:text-white sm:h-8 sm:w-8"
                            disabled={isCreatingChat || status === 'streaming'}
                          >
                            <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>

                          <Button
                            type="submit"
                            disabled={
                              isCreatingChat ||
                              status === 'streaming' ||
                              (input.trim() === '' && attachedFiles.length === 0)
                            }
                            className={`h-6 w-6 shrink-0 rounded-full p-0 transition-colors sm:h-8 sm:w-8 ${
                              (input.trim() || attachedFiles.length > 0) &&
                              !isCreatingChat &&
                              status !== 'streaming'
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'cursor-not-allowed bg-gray-600 text-gray-400'
                            }`}
                          >
                            {isCreatingChat || status === 'streaming' ? (
                              <svg
                                className="h-3 w-3 animate-spin sm:h-4 sm:w-4"
                                viewBox="0 0 24 24"
                              >
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
                              <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 text-center sm:mt-4">
                        <p className="text-xs text-gray-500">
                          ChatGPT can make mistakes. Check important info.{' '}
                          <span className="hidden sm:inline">
                            See{' '}
                            <button className="text-gray-400 underline hover:text-gray-300">
                              Cookie Preferences
                            </button>
                            .
                          </span>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
