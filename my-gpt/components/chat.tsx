'use client'

import React, { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { useUser, useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowUp, Edit, Check, X, Paperclip } from 'lucide-react'
import { FileData } from '@/components/file-upload'
import { AdvancedImage } from "@cloudinary/react"
import { Cloudinary } from '@cloudinary/url-gen'
import { fill } from '@cloudinary/url-gen/actions/resize'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'
import { InputOptions } from './input-options'
import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'


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
  const [chatTitle, setChatTitle] = useState<string>('')
  const [loadingChat, setLoadingChat] = useState(true)

  const { messages, sendMessage, status, setMessages } = useChat({
    onFinish: async (message: any) => {
    await saveAssistantMessage(message)
    
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
  setAttachedFiles([])
  
  try {
    const userMessageData = {
      text: text,
      files: currentFiles.length > 0 ? currentFiles.map(file => ({
        type: 'file',
        mediaType: file.mimeType,
        filename: file.name,
        url: file.cdnUrl,
      })) : undefined
    }

    console.log('user message ', userMessageData)

    await saveUserMessage(userMessageData)
    
    if (currentFiles.length > 0) {
      await sendMessage({
        text: text,
        files: currentFiles.map(file => ({
          type: 'file' as const,
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

 const handleFileUpload = (fileData: any) => {
    setAttachedFiles(prev => [...prev, fileData])
  }


  const saveUserMessage = async (userMessage: any) => {
  try {
    console.log('=== Saving User Message Immediately ===')
    console.log('User message to save:', userMessage)

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
      parts: userMessage.parts || [{ type: 'text', text: userMessage.text || userMessage.content || '' }],
      timestamp: new Date()
    }

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
  
  if (!file) {
    return null
  }

  const mediaType = file.mediaType || file.mimeType
  const url = file.url || file.cdnUrl
  const name = file.filename || file.name

  if (mediaType && mediaType.startsWith('image/')) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden">
        <img 
          src={url || ""} 
          alt={name || "Image"} 
          className="max-w-full max-h-[300px] object-contain rounded-lg"
        />
      </div>
    )
  }
  
  return (
    <div className="mt-2 p-3 rounded-md bg-gray-800 max-w-[300px]">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 flex-shrink-0" />
        <a 
          href={url || ""} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:underline truncate"
        >
          {name || "File"}
        </a>
      </div>
    </div>
  )
}

    if (!isLoaded || loadingChat) {
    return (
      <div className="flex flex-col h-full bg-neutral-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 p-4 space-y-8">
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
      <div className="flex flex-col items-center justify-center h-full bg-gray-800 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
          <p className="text-gray-400 mb-4">You need to be signed in to use the chat.</p>
          <Button 
            onClick={() => window.location.href = '/sign-in'}
            className="bg-green-600 hover:bg-green-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

return (
  <div className="flex flex-col h-full bg-neutral-800">

    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message, index) => {

    const textParts = message.parts
      ?.filter((part: any) => part.type === 'text')
      ?.map((part: any) => part.text)
      ?.join('') || ''
      
    let fileParts: any[] = []
    
    if (message?.files && Array.isArray(message?.files)) {
      fileParts = message.files
    }
    
    // Fallback to old format (parts-based)
    else if (message.parts) {
      fileParts = message.parts
        ?.filter((part: any) => part.type === 'file')
        ?.map((part: any) => part.file || part) || []
    }

  const isEditing = editingMessageId === message.id
  const isUserMessage = message.role === 'user'

  return (
    <div 
      key={message.id} 
      className={cn(
        "group relative",
        isUserMessage ? "flex flex-col items-end" : "flex flex-col items-start"
      )}
    >
      <div className={cn(
        "max-w-[80%] rounded-xl p-4",
        isUserMessage 
          ? "bg-neutral-700 text-white" 
          : "bg-neutral-800 text-gray-100"
      )}>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-700 text-white resize-none min-h-[100px] max-h-[300px] border-none focus:outline-none focus:ring-0 focus:border-transparent"
              rows={4}
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
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Save & Submit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="whitespace-pre-wrap break-words">
              {textParts}
            </div>
            
            {fileParts.length > 0 && fileParts.map((file, fileIndex) => (
              <div key={`${message.id}-file-${fileIndex}`} className="mt-3">
                {renderFilePreview(file)}
              </div>
            ))}
          </div>
        )}
      </div>

      {isUserMessage && !isEditing && (
        <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startEditingMessage(message.id, textParts)}
                disabled={status === 'streaming'}
                className="h-8 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
})}
        
        {status === 'streaming' && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl p-4 bg-neutral-800 text-gray-100">
              <div className="animate-pulse">Thinking...</div>
            </div>
          </div>
        )}
      </div>
    </div>
    
    <div className="p-4 border-t border-gray-700 bg-neutral-800">
  <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
    <div className="relative">

      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
        <InputOptions onFileUpload={handleFileUpload} />
      </div>

      {attachedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="relative">
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded-md"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-700 rounded-md flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setAttachedFiles(prev => prev.filter((_, i) => i !== index))
                }}
                className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        rows={1}
        className="w-full pl-12 pr-12 py-3 rounded-xl bg-neutral-700 text-white placeholder-gray-400 resize-none overflow-hidden outline-none focus:ring-1 focus:ring-gray-500 hover:bg-neutral-600 transition-colors duration-150 max-h-[200px]"
        placeholder="Ask anything"
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
        }}
        disabled={status === "streaming"}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <button
          type="submit"
          disabled={status === "streaming" || (input.trim() === "" && attachedFiles.length === 0)}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-neutral-600 hover:bg-neutral-500 text-gray-300 hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="mt-2 text-xs text-gray-500 text-center">
      ChatGPT can make mistakes. Check Important Info. See cookie preferences.
    </div>
  </form>
</div>
  </div>
)

}