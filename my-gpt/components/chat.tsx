'use client'

import React, { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { useUser, useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowUp, Edit, Check, X, Download, Eye, AlertTriangle } from 'lucide-react'
import { FileData } from '@/lib/file-data'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'
import { InputOptions } from './input-options'
import { cn } from '@/lib/utils'
import { getFileType, getFileIcon, getFileColor, formatFileSize } from './file-utilities'

interface ChatProps {
  chatId: string
  onChatUpdate?: () => void
}

export function Chat({ chatId, onChatUpdate }: ChatProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([])
  const [chatTitle, setChatTitle] = useState<string>('')
  const [loadingChat, setLoadingChat] = useState(true)

  const { messages, sendMessage, status, setMessages } = useChat({
    onFinish: async (message: any) => {
      const updatedMessages = await saveAssistantMessage(message)

      // Now sync the real IDs from database to the local state
      if (updatedMessages) {
        const convertedMessages = updatedMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          parts: msg.parts || [{ type: 'text', text: msg.content }],
        }))
        setMessages(convertedMessages)
      }

      onChatUpdate?.()
    },

    onError: (error: any) => {
      console.error('Chat error:', error)
      if (error.message.includes('Unauthorized')) {
        window.location.href = '/sign-in'
      }
    },
  })

  useEffect(() => {
    if (chatId && isSignedIn) {
      loadChat()
    }
  }, [chatId, isSignedIn])

  const loadChat = async () => {
    try {
      setLoadingChat(true)
      const response = await fetch(`/api/chats/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        const chat = data.chat
        setChatTitle(chat.title)

        const convertedMessages = chat.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          parts: msg.parts || [{ type: 'text', text: msg.content }],
        }))

        setMessages(convertedMessages)
      } else if (response.status === 404) {
        console.warn('Chat not found:', chatId)
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    } finally {
      setLoadingChat(false)
    }
  }

  useEffect(() => {
    // This will run whenever messages change
    // We need to sync any user messages that might have temporary IDs
    const syncMessageIds = async () => {
      if (messages.length === 0) return

      const lastMessage = messages[messages.length - 1]

      // Check if the last message is a user message with a temporary ID
      if (lastMessage.role === 'user' && lastMessage.id.startsWith('user-')) {
        try {
          const response = await fetch(`/api/chats/${chatId}`)
          if (response.ok) {
            const data = await response.json()
            const dbMessages = data.chat?.messages || []

            if (dbMessages.length > 0) {
              // Update messages with real IDs from database
              const convertedMessages = dbMessages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                parts: msg.parts || [{ type: 'text', text: msg.content }],
              }))
              setMessages(convertedMessages)
            }
          }
        } catch (error) {
          console.error('Error syncing message IDs:', error)
        }
      }
    }

    // Only sync if we have messages and the last one might need ID syncing
    if (messages.length > 0) {
      const timeoutId = setTimeout(syncMessageIds, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length, chatId])

  const saveAssistantMessage = async (assistantMessage: any) => {
    try {
      console.log('Saving assistant message')
      console.log('Assistant message to save:', assistantMessage)

      const existingResponse = await fetch(`/api/chats/${chatId}`)
      let existingMessages = []

      if (existingResponse.ok) {
        const chatData = await existingResponse.json()
        existingMessages = chatData.chat?.messages || []
      }

      console.log('Existing messages before adding assistant message:', existingMessages)

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

      console.log('All messages including new assistant message:', allMessages)

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

      const result = await response.json()
      console.log('Assistant message saved successfully')

      // Return the updated messages with actual IDs
      return result.messages || allMessages
    } catch (error) {
      console.error('Error saving assistant message:', error)
      throw error
    }
  }

  const generateTitleFromMessage = (message: any) => {
    const content = message.content || ''
    return content.length > 50 ? content.substring(0, 50) + '...' : content || 'New Chat'
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if ((!text && attachedFiles.length === 0) || status === 'streaming') return

    setInput('')
    const currentFiles = [...attachedFiles]
    setAttachedFiles([])

    try {
      const userMessageData = {
        text: text,
        files:
          currentFiles.length > 0
            ? currentFiles.map((file) => ({
                type: 'file',
                mediaType: file.mimeType,
                filename: file.name,
                url: file.cdnUrl,
              }))
            : undefined,
      }

      await saveUserMessage(userMessageData)

      if (currentFiles.length > 0) {
        await sendMessage({
          text: text,
          files: currentFiles.map((file) => ({
            type: 'file' as const,
            mediaType: file.mimeType,
            filename: file.name,
            url: file.cdnUrl,
          })),
        })
      } else {
        await sendMessage({
          text: text,
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const startEditingMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId)
    setEditingText(currentText)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  const saveEditedMessage = async (messageId: string) => {
    const trimmedText = editingText.trim()
    if (!trimmedText) return

    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    try {
      console.log('Editing message:', messageId, 'with content:', trimmedText)

      const editResponse = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: trimmedText,
          action: 'replace',
        }),
      })

      if (!editResponse.ok) {
        throw new Error('Failed to edit message')
      }

      const editResult = await editResponse.json()
      console.log('Edit result:', editResult)

      const messagesUpToEdit = messages.slice(0, messageIndex)
      const restOfMessages = messages.slice(messageIndex + 2, messages.length)
      setMessages([...messagesUpToEdit, ...restOfMessages])

      setEditingMessageId(null)
      setEditingText('')

      await sendMessage({
        text: trimmedText,
      })

      console.log('Message edited and regenerated successfully')
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Failed to edit message. Please try again.')
    }
  }

  const handleFileUpload = (fileData: any) => {
    setAttachedFiles((prev) => [...prev, fileData])
  }

  const saveUserMessage = async (userMessage: any, options?: { replaceMode?: boolean }) => {
    try {
      console.log('=== Saving User Message ===')
      console.log('User message to save:', userMessage)
      console.log('Options:', options)

      const existingResponse = await fetch(`/api/chats/${chatId}`)
      let existingMessages = []

      if (existingResponse.ok) {
        const chatData = await existingResponse.json()
        existingMessages = chatData.chat?.messages || []
      }

      console.log('Existing messages before adding user message:', existingMessages)

      const formattedUserMessage = {
        id: userMessage.id || `user-${Date.now()}`,
        role: 'user',
        content: userMessage.text || userMessage.content || '',
        parts: userMessage.parts || [
          { type: 'text', text: userMessage.text || userMessage.content || '' },
        ],
        timestamp: new Date(),
      }

      if (userMessage.files && userMessage.files.length > 0) {
        const fileParts = userMessage.files.map((file: any) => ({
          type: 'file',
          file: {
            type: 'file',
            mediaType: file.mediaType,
            name: file.filename,
            url: file.url || file.cdnUrl,
          },
        }))
        formattedUserMessage.parts = [...formattedUserMessage.parts, ...fileParts]
      }

      const allMessages = [...existingMessages, formattedUserMessage]

      console.log('All messages including new user message:', allMessages)

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
          ...(chatTitle === 'New Chat' && {
            title: generateTitleFromMessage(formattedUserMessage),
          }),
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save user message: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('User message saved successfully:', result)
    } catch (error) {
      console.error('Error saving user message:', error)
      throw error
    }
  }

  const renderFilePreview = (file: any) => {
    if (!file) {
      return null
    }

    const mediaType = file.mediaType || file.mimeType || ''
    const url = file.url || file.cdnUrl || ''
    const name = file.filename || file.name || 'Unknown file'
    const size = file.size || 0
    const fileType = getFileType(mediaType)

    if (fileType === 'image') {
      return (
        <div className="mt-2 max-w-md overflow-hidden rounded-lg">
          <img
            src={url}
            alt={name}
            className="max-h-[300px] max-w-full rounded-lg object-contain"
            onError={(e) => {
              // Fallback to file card if image fails to load
              e.currentTarget.style.display = 'none'
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
              if (nextElement) {
                nextElement.classList.remove('hidden')
              }
            }}
          />
          <div className="hidden">{renderFileCard(fileType, name, url, size, mediaType)}</div>
        </div>
      )
    }

    // Video preview
    if (fileType === 'video') {
      return (
        <div className="mt-2 max-w-md overflow-hidden rounded-lg">
          <video
            controls
            className="max-h-[300px] max-w-full rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
              if (nextElement) {
                nextElement.classList.remove('hidden')
              }
            }}
          >
            <source src={url} type={mediaType} />
            Your browser does not support the video tag.
          </video>
          <div className="hidden">{renderFileCard(fileType, name, url, size, mediaType)}</div>
        </div>
      )
    }

    // Audio preview
    if (fileType === 'audio') {
      return (
        <div className="mt-2 max-w-md">
          <audio
            controls
            className="w-full rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
              if (nextElement) {
                nextElement.classList.remove('hidden')
              }
            }}
          >
            <source src={url} type={mediaType} />
            Your browser does not support the audio tag.
          </audio>
          <div className="hidden">{renderFileCard(fileType, name, url, size, mediaType)}</div>
        </div>
      )
    }

    // All other file types (PDF, documents, etc.)
    return renderFileCard(fileType, name, url, size, mediaType)
  }

  // File card component for non-media files
  const renderFileCard = (
    fileType: string,
    name: string,
    url: string,
    size: number,
    mediaType: string
  ) => {
    const colorClasses = getFileColor(fileType)

    return (
      <div className={`mt-2 max-w-md rounded-lg border-2 p-4 ${colorClasses}`}>
        <div className="flex items-start gap-3">
          {getFileIcon(fileType, 'h-8 w-8')}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="truncate text-sm font-medium text-white" title={name}>
                {name}
              </h4>
            </div>

            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <span className="uppercase">{fileType}</span>
              {size > 0 && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(size)}</span>
                </>
              )}
              {mediaType && (
                <>
                  <span>•</span>
                  <span className="truncate">{mediaType.split('/')[1]?.toUpperCase()}</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-neutral-700 px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-neutral-600 hover:text-blue-300"
              >
                <Eye className="h-3 w-3" />
                View
              </a>
              <a
                href={url}
                download={name}
                className="flex items-center gap-1 rounded bg-neutral-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-neutral-600 hover:text-white"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded || loadingChat) {
    return (
      <div className="flex h-full flex-col bg-neutral-800">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 space-y-8 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-800 p-4">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-xl font-semibold">Please Sign In</h2>
          <p className="mb-4 text-gray-400">You need to be signed in to use the chat.</p>
          <Button
            onClick={() => (window.location.href = '/sign-in')}
            className="bg-green-600 hover:bg-green-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-neutral-800">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message, index) => {
            const textParts =
              message.parts
                ?.filter((part: any) => part.type === 'text')
                ?.map((part: any) => part.text)
                ?.join('') || ''

            let fileParts: any[] = []

            if (message?.files && Array.isArray(message?.files)) {
              fileParts = message.files
            }

            // Fallback to old format (parts-based)
            else if (message.parts) {
              fileParts =
                message.parts
                  ?.filter((part: any) => part.type === 'file')
                  ?.map((part: any) => part.file || part) || []
            }

            const isEditing = editingMessageId === message.id
            const isUserMessage = message.role === 'user'

            return (
              <div
                key={message.id}
                className={cn(
                  'group relative',
                  isUserMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl p-4',
                    isUserMessage ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-gray-100'
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="max-h-[300px] min-h-[100px] w-full resize-none rounded-lg bg-neutral-700 p-3 text-white focus:border-transparent focus:ring-0 focus:outline-none"
                          rows={4}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              cancelEditing()
                            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              saveEditedMessage(message.id)
                            }
                          }}
                          placeholder="Edit your message..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          disabled={status === 'streaming'}
                          className="h-8 rounded-full bg-black px-3 text-gray-300 hover:bg-neutral-900 hover:text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEditedMessage(message.id)}
                          disabled={!editingText.trim() || status === 'streaming'}
                          className="h-8 rounded-full bg-white px-3 text-black hover:bg-gray-200"
                        >
                          {status === 'streaming' ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Generating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">Send</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="break-words whitespace-pre-wrap">{textParts}</div>

                      {fileParts.length > 0 &&
                        fileParts.map((file, fileIndex) => (
                          <div key={`${message.id}-file-${fileIndex}`} className="mt-3">
                            {renderFilePreview(file)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {isUserMessage && !isEditing && (
                  <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingMessage(message.id, textParts)}
                          disabled={status === 'streaming'}
                          className="h-8 p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div>Edit message</div>
                          <div className="text-gray-400">This will regenerate the AI response</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            )
          })}

          {status === 'streaming' && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl bg-neutral-800 p-4 text-gray-100">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-gray-700 bg-neutral-800 p-4">
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
          <div className="relative">
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
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
                              onClick={() => {
                                setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
                              }}
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
                            onClick={() => {
                              setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
                            }}
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

            <div className="relative">
              <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2">
                <InputOptions onFileUpload={handleFileUpload} />
              </div>

              <textarea
                rows={1}
                className="max-h-[200px] w-full resize-none overflow-hidden rounded-xl bg-neutral-700 py-3 pr-12 pl-12 text-white placeholder-gray-400 transition-colors duration-150 outline-none hover:bg-neutral-600 focus:ring-1 focus:ring-gray-500"
                placeholder="Ask anything"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
                }}
                disabled={status === 'streaming'}
              />

              <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
                <button
                  type="submit"
                  disabled={
                    status === 'streaming' || (input.trim() === '' && attachedFiles.length === 0)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-gray-300 transition-colors duration-150 hover:bg-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-xs text-gray-500">
            ChatGPT can make mistakes. Check Important Info. See cookie preferences.
          </div>
        </form>
      </div>
    </div>
  )
}
