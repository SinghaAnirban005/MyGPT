'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowUp, Edit, X, Download, Eye, Pencil, Mic } from 'lucide-react'
import { FileData } from '@/lib/file-data'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'
import { InputOptions } from './input-options'
import { cn } from '@/lib/utils'
import { getFileType, getFileIcon, getFileColor, formatFileSize } from './file-utilities'

interface ChatProps {
  chatId: string
  onChatUpdate?: () => void
  useChatHook?: any
}

export function Chat({ chatId, onChatUpdate, useChatHook }: ChatProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user, isLoaded, isSignedIn } = useUser()
  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isProcessingEdit, setIsProcessingEdit] = useState(false)

  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([])
  const [chatTitle, setChatTitle] = useState<string>('')
  const [loadingChat, setLoadingChat] = useState(true)

  const { messages, sendMessage, status, setMessages } =
    useChatHook ||
    useChat({
      onFinish: async (message: any) => {
        console.log('finally saving assistant message ', message)

        // Only save assistant message if not processing an edit
        if (!isProcessingEdit) {
          const updatedMessages = await saveAssistantMessage(message)

          if (updatedMessages) {
            const convertedMessages = updatedMessages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: msg.parts || [{ type: 'text', text: msg.content }],
            }))
            setMessages(convertedMessages)
          }
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

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  useEffect(() => {
    if (chatId && isSignedIn) {
      loadChat()
    }
  }, [chatId, isSignedIn])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [messages, status])

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

        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      } else if (response.status === 404) {
        console.warn('Chat not found:', chatId)
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    } finally {
      setLoadingChat(false)
    }
  }

  // Enhanced message ID syncing function
  const syncMessageIdsFromDatabase = async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        const dbMessages = data.chat?.messages || []

        if (dbMessages.length > 0) {
          const convertedMessages = dbMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            parts: msg.parts || [{ type: 'text', text: msg.content }],
          }))

          console.log('Syncing message IDs from database:', convertedMessages)
          setMessages(convertedMessages)
          return convertedMessages
        }
      }
    } catch (error) {
      console.error('Error syncing message IDs:', error)
    }
    return null
  }

  useEffect(() => {
    // This will run whenever messages change
    // We need to sync any messages that might have temporary/generated IDs from the AI SDK
    const syncMessageIds = async () => {
      if (messages.length === 0 || isProcessingEdit) return

      const lastMessage = messages[messages.length - 1]

      // If the last message is a user message, we should sync to get the real database state
      if (lastMessage && lastMessage.role === 'user') {
        console.log('User message detected, syncing with database to ensure proper IDs...')
        await syncMessageIdsFromDatabase()
      }
    }

    // Only sync if we have messages and not processing an edit
    if (messages.length > 0 && !isProcessingEdit) {
      const timeoutId = setTimeout(syncMessageIds, 1000) // Give time for database save
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length, chatId, isProcessingEdit])

  const saveAssistantMessage = async (assistantMessage: any) => {
    try {
      // Only save if not processing an edit
      if (isProcessingEdit) {
        console.log('Skipping assistant message save during edit processing')
        return null
      }

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
    if ((!text && attachedFiles.length === 0) || status === 'streaming' || isProcessingEdit) return

    setInput('')
    const currentFiles = [...attachedFiles]
    setAttachedFiles([])

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

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

      // Sync message IDs after saving user message only if not processing an edit
      if (!isProcessingEdit) {
        setTimeout(async () => {
          await syncMessageIdsFromDatabase()
        }, 1000)
      }

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
    console.log('Starting to edit message with ID:', messageId)
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
    if (messageIndex === -1) {
      console.error('Message not found for editing:', messageId)
      return
    }

    try {
      setIsProcessingEdit(true)
      console.log('Editing message:', messageId, 'with content:', trimmedText)

      // Get the original message's file parts for re-sending
      const originalMessage = messages[messageIndex]
      let fileParts: any[] = []

      if (originalMessage?.files && Array.isArray(originalMessage?.files)) {
        fileParts = originalMessage.files
      } else if (originalMessage.parts) {
        fileParts =
          originalMessage.parts
            ?.filter((part: any) => part.type === 'file')
            ?.map((part: any) => part.file || part) || []
      }

      console.log('Preserving file attachments for re-send:', fileParts)

      // Create the updated message data with preserved attachments
      const updatedMessageData = {
        content: trimmedText,
        parts: [
          { type: 'text', text: trimmedText },
          ...fileParts.map((file: any) => ({
            type: 'file',
            file: {
              type: 'file',
              mediaType: file.mediaType || file.mimeType,
              filename: file.filename || file.name,
              name: file.filename || file.name,
              url: file.url || file.cdnUrl,
              cdnUrl: file.url || file.cdnUrl,
            },
          })),
        ],
        // Store files at message level for easier access
        ...(fileParts.length > 0 && {
          files: fileParts.map((file: any) => ({
            type: 'file',
            mediaType: file.mediaType || file.mimeType,
            filename: file.filename || file.name,
            name: file.filename || file.name,
            url: file.url || file.cdnUrl,
            cdnUrl: file.url || file.cdnUrl,
          })),
        }),
      }

      console.log('Updating message with preserved attachments:', updatedMessageData)

      // Update the message in the database
      const editResponse = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedMessageData,
          action: 'replace',
        }),
      })

      if (!editResponse.ok) {
        throw new Error('Failed to edit message')
      }

      const editResult = await editResponse.json()
      console.log('Edit result:', editResult)

      // Clear editing state immediately
      setEditingMessageId(null)
      setEditingText('')

      // Remove messages from the edited message onwards to prevent duplication
      const messagesUpToEdit = messages.slice(0, messageIndex)

      // Update local state to remove subsequent messages
      setMessages(messagesUpToEdit)

      console.log('Re-sending message with attachments:', fileParts)

      // Send the new message with original attachments preserved
      if (fileParts.length > 0) {
        await sendMessage({
          text: trimmedText,
          files: fileParts.map((file: any) => ({
            type: 'file' as const,
            mediaType: file.mediaType || file.mimeType,
            filename: file.filename || file.name,
            url: file.url || file.cdnUrl,
          })),
        })
      } else {
        await sendMessage({
          text: trimmedText,
        })
      }

      console.log('Message edited and regenerated successfully with attachments preserved')
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Failed to edit message. Please try again.')
    } finally {
      // Always reset processing state
      setIsProcessingEdit(false)
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

      // Create text parts
      const textParts =
        userMessage.text || userMessage.content
          ? [{ type: 'text', text: userMessage.text || userMessage.content }]
          : []

      // Create file parts if files exist
      const fileParts =
        userMessage.files && userMessage.files.length > 0
          ? userMessage.files.map((file: any) => ({
              type: 'file',
              file: {
                type: 'file',
                mediaType: file.mediaType,
                filename: file.filename,
                name: file.filename, // Add both for compatibility
                url: file.url,
                cdnUrl: file.url, // Add both for compatibility
              },
            }))
          : []

      const formattedUserMessage = {
        id: userMessage.id || `user-${Date.now()}`,
        role: 'user',
        content: userMessage.text || userMessage.content || '',
        parts: [...textParts, ...fileParts],
        timestamp: new Date(),
        // Store files at message level for easier access
        ...(userMessage.files &&
          userMessage.files.length > 0 && {
            files: userMessage.files.map((file: any) => ({
              type: 'file',
              mediaType: file.mediaType,
              filename: file.filename,
              name: file.filename,
              url: file.url,
              cdnUrl: file.url,
            })),
          }),
      }

      console.log('Formatted user message with preserved attachments:', formattedUserMessage)

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
      console.log('User message saved successfully with attachments:', result)
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
        <div className="mt-2 max-w-xs overflow-hidden rounded-lg sm:max-w-sm md:max-w-md">
          <img
            src={url}
            alt={name}
            className="max-h-[200px] max-w-full rounded-lg object-contain sm:max-h-[250px] md:max-h-[300px]"
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
        <div className="mt-2 max-w-xs overflow-hidden rounded-lg sm:max-w-sm md:max-w-md">
          <video
            controls
            className="max-h-[200px] max-w-full rounded-lg sm:max-h-[250px] md:max-h-[300px]"
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
      <div
        className={`mt-2 max-w-xs rounded-lg border-2 p-3 sm:max-w-sm sm:p-4 md:max-w-md ${colorClasses}`}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          {getFileIcon(fileType, 'h-6 w-6 sm:h-8 sm:w-8')}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="truncate text-xs font-medium text-white sm:text-sm" title={name}>
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
                <span className="hidden sm:inline">View</span>
              </a>
              <a
                href={url}
                download={name}
                className="flex items-center gap-1 rounded bg-neutral-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-neutral-600 hover:text-white"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Download</span>
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
        <div className="flex items-center justify-between border-b border-gray-700 p-3 sm:p-4">
          <Skeleton className="h-6 w-24 sm:h-8 sm:w-32" />
          <Skeleton className="h-6 w-6 rounded-full sm:h-8 sm:w-8" />
        </div>
        <div className="flex-1 space-y-6 p-3 sm:space-y-8 sm:p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 sm:gap-4">
              <Skeleton className="h-6 w-6 rounded-full sm:h-8 sm:w-8" />
              <Skeleton className="h-12 w-full rounded-md sm:h-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white p-4">
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
      <div ref={messagesContainerRef} className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div className="mx-auto max-w-full space-y-4 sm:max-w-2xl sm:space-y-6 md:max-w-3xl lg:max-w-4xl">
          {messages.map((message, index) => {
            console.log('MESSAGE ', message)
            const textParts =
              message.parts
                ?.filter((part: any) => part.type === 'text')
                ?.map((part: any) => part.text)
                ?.join('') || ''

            let fileParts: any[] = []

            if (message?.files && Array.isArray(message?.files)) {
              fileParts = message.files
            } else if (message.parts) {
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
                  'group relative w-full',
                  isUserMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'
                )}
              >
                {/* User messages - size based on content */}
                {isUserMessage ? (
                  <div className="flex w-full flex-col items-end">
                    <div
                      className={cn(
                        'relative max-w-fit rounded-xl p-3 sm:p-4', // Changed to max-w-fit for user messages
                        'bg-neutral-700 text-white'
                      )}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="max-h-[200px] min-h-[80px] w-full resize-none rounded-lg bg-neutral-600 p-2 text-sm text-white focus:border-transparent focus:ring-0 focus:outline-none sm:max-h-[300px] sm:min-h-[100px] sm:p-3 sm:text-base"
                              rows={3}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  cancelEditing()
                                } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  saveEditedMessage(message.id)
                                }
                              }}
                            />
                          </div>

                          {fileParts.length > 0 && (
                            <div className="border-t border-neutral-600 pt-3">
                              <div className="flex flex-wrap gap-2 opacity-60">
                                {fileParts.map((file, fileIndex) => (
                                  <div key={`edit-preview-${fileIndex}`} className="relative">
                                    {getFileType(file.mediaType || file.mimeType) === 'image' ? (
                                      <img
                                        src={file.url || file.cdnUrl}
                                        alt={file.filename || file.name}
                                        className="h-10 w-10 rounded-md border border-gray-600 object-cover sm:h-12 sm:w-12"
                                      />
                                    ) : (
                                      <div
                                        className={`h-10 w-12 rounded-md border sm:h-12 sm:w-16 ${getFileColor(getFileType(file.mediaType || file.mimeType))} flex flex-col items-center justify-center p-1`}
                                      >
                                        {getFileIcon(
                                          getFileType(file.mediaType || file.mimeType),
                                          'h-3 w-3 sm:h-4 sm:w-4'
                                        )}
                                        <span
                                          className="mt-0.5 w-full truncate text-center text-xs text-gray-300"
                                          title={file.filename || file.name}
                                        >
                                          {(file.filename || file.name).length > 4
                                            ? (file.filename || file.name).substring(0, 3) + '..'
                                            : file.filename || file.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={status === 'streaming' || isProcessingEdit}
                              className="h-7 rounded-full bg-black px-2 text-xs text-gray-300 hover:bg-neutral-900 hover:text-white sm:h-8 sm:px-3 sm:text-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveEditedMessage(message.id)}
                              disabled={
                                !editingText.trim() || status === 'streaming' || isProcessingEdit
                              }
                              className="h-7 rounded-full bg-white px-2 text-xs text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400 sm:h-8 sm:px-3 sm:text-sm"
                            >
                              Send
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="text-sm break-words whitespace-pre-wrap sm:text-base">
                            {textParts}
                          </div>

                          {fileParts.length > 0 &&
                            fileParts.map((file, fileIndex) => (
                              <div key={`${message.id}-file-${fileIndex}`} className="mt-3">
                                {renderFilePreview(file)}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="mt-1 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:mt-2 sm:gap-2 sm:opacity-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingMessage(message.id, textParts)}
                              disabled={status === 'streaming' || isProcessingEdit}
                              className="h-6 w-6 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 sm:p-1.5"
                            >
                              <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div>Edit message</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-start">
                    <div
                      className={cn(
                        'relative max-w-[85%] rounded-xl p-3 sm:max-w-[80%] sm:p-4 md:max-w-[75%] lg:max-w-[70%]', // Assistant messages keep fixed max width
                        'bg-neutral-800 text-gray-100'
                      )}
                    >
                      <div className="relative">
                        <div className="text-sm break-words whitespace-pre-wrap sm:text-base">
                          {textParts}
                        </div>

                        {fileParts.length > 0 &&
                          fileParts.map((file, fileIndex) => (
                            <div key={`${message.id}-file-${fileIndex}`} className="mt-3">
                              {renderFilePreview(file)}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />

          {status === 'streaming' && (
            <div className="flex justify-start">
              <div className="mr-auto max-w-[85%] rounded-xl bg-neutral-800 p-3 text-gray-100 sm:max-w-[80%] sm:p-4 md:max-w-[75%] lg:max-w-[70%]">
                <div className="animate-pulse text-sm sm:text-base">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-gray-700 bg-neutral-800 p-3 sm:p-4">
        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl"
        >
          <div className="relative">
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
                              onClick={() => {
                                setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
                              }}
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
                            {file.name.length > 6 ? file.name.substring(0, 4) + '..' : file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
                            }}
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
              <div className="flex shrink-0 items-center space-x-1 pb-1 sm:space-x-2">
                <InputOptions onFileUpload={handleFileUpload} />
              </div>

              <div className="mx-2 min-w-0 flex-1 sm:mx-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message ChatGPT"
                  className="max-h-[120px] min-h-[20px] w-full resize-none bg-transparent py-1 text-sm text-white placeholder-gray-400 outline-none sm:max-h-[200px] sm:py-2 sm:text-base"
                  disabled={status === 'streaming' || isProcessingEdit}
                  rows={1}
                  style={{
                    height: 'auto',
                    lineHeight: '1.5',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (input.trim() || attachedFiles.length > 0) {
                        onSubmit(e)
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
                  className="mb-1 h-7 w-7 rounded-full text-white transition-colors hover:bg-neutral-600 hover:text-white sm:h-8 sm:w-8"
                  disabled={status === 'streaming' || isProcessingEdit}
                >
                  <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>

                <Button
                  type="submit"
                  disabled={
                    status === 'streaming' ||
                    isProcessingEdit ||
                    (input.trim() === '' && attachedFiles.length === 0)
                  }
                  className={cn(
                    'mb-1 h-7 w-7 shrink-0 rounded-full p-0 transition-colors sm:h-8 sm:w-8',
                    (input.trim() || attachedFiles.length > 0) &&
                      status !== 'streaming' &&
                      !isProcessingEdit
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'cursor-not-allowed bg-gray-600 text-gray-400'
                  )}
                >
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-2 text-center">
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
          </div>
        </form>
      </div>
    </div>
  )
}
