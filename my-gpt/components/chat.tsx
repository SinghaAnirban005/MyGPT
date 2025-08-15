'use client'

import React, { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { useUser, useAuth } from '@clerk/nextjs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Edit, Check, X, RotateCcw, Paperclip, Brain, Trash2, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileUpload, FileData } from '@/components/file-upload'
import { AdvancedImage } from "@cloudinary/react"
import { Cloudinary } from '@cloudinary/url-gen'
import { fill } from '@cloudinary/url-gen/actions/resize'

const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
})

interface ChatProps {
  chatId: string
  onChatUpdate?: () => void
}

export function Chat({ chatId, onChatUpdate }: ChatProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useAuth()
  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([])
  const [memoryStatus, setMemoryStatus] = useState<'idle' | 'loading' | 'stored'>('idle')
  const [chatTitle, setChatTitle] = useState<string>('')
  const [loadingChat, setLoadingChat] = useState(true)

  const { messages, sendMessage, status, setMessages } = useChat({
    onFinish: async (message: any) => {
    setMemoryStatus('loading')
    
    await saveAssistantMessage(message)
    
    setMemoryStatus('stored')
    setTimeout(() => setMemoryStatus('idle'), 3000)
    
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
          parts: msg.parts || [{ type: 'text', text: msg.content }]
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

  const saveAssistantMessage = async (assistantMessage: any) => {
  try {
    console.log('Saving assistant message')
    console.log('Assistant message to save:', assistantMessage)
    
    // Get existing messages from database (should now include the user message)
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
      timestamp: new Date()
    }
    
    // Combine existing messages with new assistant message
    const allMessages = [...existingMessages, formattedAssistantMessage]
    
    console.log('All messages including new assistant message:', allMessages)
    
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages: allMessages
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to save assistant message: ${response.statusText}`)
    }
    
    console.log('Assistant message saved successfully')
    
  } catch (error) {
    console.error('Error saving assistant message:', error)
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
  console.log('current files ', currentFiles)
  setAttachedFiles([])
  
  try {
    const userMessageData = {
      text: text,
      files: currentFiles.length > 0 ? currentFiles.map(file => ({
        type: 'file',
        mediaType: file.mimeType,
        filename: file.name,
        url: file.cdnUrl
      })) : undefined
    }

    console.log('user Message Data -> ', userMessageData)
    
    // Save user message immediately before sending to API
    await saveUserMessage(userMessageData)
    
    // Send message to AI
    if (currentFiles.length > 0) {
      await sendMessage({
        text: text,
        files: currentFiles.map(file => ({
          type: 'file',
          mediaType: file.mimeType,
          filename: file.name,
          url: file.cdnUrl
        }))
      })
    } else {
      await sendMessage({
        text: text
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

    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    const messagesUpToEdit = messages.slice(0, messageIndex)
    const restOfMessages = messages.slice(messageIndex + 2, messages.length)
    const updatedMessages = [...messagesUpToEdit, ...restOfMessages]

    setMessages(updatedMessages)
    setEditingMessageId(null)
    setEditingText('')

    try {
      await sendMessage({
        text: trimmedText
      })
    } catch (error) {
      console.error('Error regenerating response:', error)
    }
  }

  const regenerateResponse = async (fromMessageIndex: number) => {
    if (status === 'streaming') return

    const userMessage = messages[fromMessageIndex]
    if (!userMessage || userMessage.role !== 'user') return

    const messagesUpToUser = messages.slice(0, fromMessageIndex + 1)
    setMessages(messagesUpToUser)

    const userText = userMessage.parts
      ?.filter((part: any) => part.type === 'text')
      ?.map((part: any) => part.text)
      ?.join('') || ''

    if (userText) {
      try {
        await sendMessage({
          text: userText
        })
      } catch (error) {
        console.error('Error regenerating response:', error)
      }
    }
  }

  const saveUserMessage = async (userMessage: any) => {
  try {
    console.log('=== Saving User Message Immediately ===')
    console.log('User message to save:', userMessage)
    
    // Get existing messages from database
    const existingResponse = await fetch(`/api/chats/${chatId}`)
    let existingMessages = []
    
    if (existingResponse.ok) {
      const chatData = await existingResponse.json()
      existingMessages = chatData.chat?.messages || []
    }
    
    console.log('Existing messages before adding user message:', existingMessages)
    
    // Format the user message
    const formattedUserMessage = {
      id: userMessage.id || `user-${Date.now()}`,
      role: 'user',
      content: userMessage.text || userMessage.content || '',
      parts: userMessage.parts || [{ type: 'text', text: userMessage.text || userMessage.content || '' }],
      timestamp: new Date()
    }
    
    // Add files if present
    if (userMessage.files && userMessage.files.length > 0) {
      const fileParts = userMessage.files.map(file => ({
        type: 'file',
        file: {
          type: 'file',
          mediaType: file.mediaType,
          name: file.filename,
          url: file.url || file.cdnUrl,
        }
      }))
      formattedUserMessage.parts = [
        ...formattedUserMessage.parts,
        ...fileParts
      ]
    }
    
    // Combine existing messages with new user message
    const allMessages = [...existingMessages, formattedUserMessage]
    
    console.log('All messages including new user message:', allMessages)
    
    // Save to database
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages: allMessages,
        ...(chatTitle === 'New Chat' && {
          title: generateTitleFromMessage(formattedUserMessage)
        })
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to save user message: ${response.statusText}`)
    }
    
    console.log('User message saved successfully')
    
  } catch (error) {
    console.error('Error saving user message:', error)
  }
}


  const renderFilePreview = (file: any) => {
    if (file && file.mediaType.startsWith('image/')) {
      const imageUrl = file.url || file.cdnUrl
      const uuid = file.uuid
      
      if (uuid && cld) {
        const image = cld.image(uuid).resize(fill().width(300).height(200))
        return (
          <div className="mt-2 border rounded-md overflow-hidden max-w-[300px]">
            <AdvancedImage cldImg={image} className="w-full" />
            <div className="p-2 bg-background text-xs">
              <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View full image
              </a>
            </div>
          </div>
        )
      } else if (imageUrl) {
        return (
          <div className="mt-2 border rounded-md overflow-hidden max-w-[300px]">
            <img src={imageUrl} alt={file.name} className="w-full" />
            <div className="p-2 bg-background text-xs">
              <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View full image
              </a>
            </div>
          </div>
        )
      }
    }
    if (!isSignedIn) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-semibold mb-4">Please sign in to chat</h2>
          <a href="/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign In
          </a>
        </div>
      )
    }
    
    
    return (
      <div className="mt-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 max-w-[300px]">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 flex-shrink-0" />
          <a 
            href={file?.cdnUrl || ''} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate"
          >
            {file.name}
          </a>
          {file?.filename || "-"}
        </div>
      </div>
    )
  }

  if (!isLoaded || loadingChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center h-full">
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-blue-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{chatTitle || 'New Chat'}</span>
            {memoryStatus === 'loading' && (
              <div className="text-xs text-blue-500 animate-pulse">Storing memory...</div>
            )}
            {memoryStatus === 'stored' && (
              <div className="text-xs text-green-500">Memory updated</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="text-xs">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {user.firstName} {user.lastName}
              </span>
              <div className="text-xs h-4">
                Memory Enabled
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const textParts = message.parts
              ?.filter((part: any) => part.type === 'text')
              ?.map((part: any) => part.text)
              ?.join('') || ''
              
            const fileParts = message.parts
              ?.filter((part: any) => part.type === 'file')
              ?.map((part: any) => part.file) || []

            const isEditing = editingMessageId === message.id
            const isUserMessage = message.role === 'user'
            const isLastUserMessage = isUserMessage && 
              index === messages.findLastIndex(msg => msg.role === 'user')

            return (
              <div key={message.id} className="group relative">
                <div className="flex items-start gap-3">
                  <Avatar className="flex-shrink-0">
                    <AvatarImage src={message.role === 'user' ? user.imageUrl : ''} />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      {message.role === 'user' 
                        ? `${user.firstName?.[0]}${user.lastName?.[0]}` 
                        : 'AI'
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none min-h-[60px]"
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEditedMessage(message.id)}
                            disabled={!editingText.trim() || status === 'streaming'}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save & Submit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative">
                        {textParts && (
                          <div className="whitespace-pre-wrap break-words">{textParts}</div>
                        )}
                        
                        {fileParts.map((file, fileIndex) => (
                          <div key={`${message.id}-file-${fileIndex}`}>
                            {renderFilePreview(file)}
                          </div>
                        ))}
                        {isUserMessage && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingMessage(message.id, textParts)}
                              disabled={status === 'streaming'}
                              className="h-6 w-6 p-0"
                              title="Edit message"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {!isLastUserMessage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => regenerateResponse(index)}
                                disabled={status === 'streaming'}
                                className="h-6 w-6 p-0"
                                title="Regenerate from here"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {status === 'streaming' && (
            <div className="flex items-start gap-3">
              <Avatar className="flex-shrink-0">
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700">AI</AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <FileUpload 
            onFilesChange={setAttachedFiles} 
            disabled={status === 'streaming'}
          />
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Message with personalized memory..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status === 'streaming'}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={status === 'streaming' || (input.trim() === '' && attachedFiles.length === 0)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}