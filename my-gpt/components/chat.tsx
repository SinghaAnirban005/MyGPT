'use client'
import React, { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Edit, Check, X, RotateCcw, Paperclip } from 'lucide-react'
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

export function Chat() {
  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([])
  
  const { messages, sendMessage, status, setMessages } = useChat()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if ((!text && attachedFiles.length === 0) || status === 'streaming') return
    
    setInput('')
    const currentFiles = [...attachedFiles]
    setAttachedFiles([])
    
    try {
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

    const updatedMessage = {
      ...messages[messageIndex],
      parts: [{
        type: 'text',
        text: trimmedText
      }]
    }

    console.log('All messages -> ', messages)

    const messagesUpToEdit = messages.slice(0, messageIndex)
    const restOfMessages = messages.slice(messageIndex + 2, messages.length)
    const updatedMessages = [...messagesUpToEdit, ...restOfMessages]

    console.log("uptil updated -> ", messagesUpToEdit)
    console.log("Rest -> ", restOfMessages)
    console.log('upadted one --> ', updatedMessage)

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

  const renderFilePreview = (file: any) => {
    if (file.type && file.mediaType.startsWith('image/')) {
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
    
    return (
      <div className="mt-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 max-w-[300px]">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 flex-shrink-0" />
          <a 
            href={file.url || file.cdnUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate"
          >
            {file.name}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const textParts = message.parts
              ?.filter((part: any) => part.type === 'text')
              ?.map((part: any) => part.text)
              ?.join('') || ''
              
            const fileParts = message.parts
              ?.filter((part: any) => part.type === 'file')

            const isEditing = editingMessageId === message.id
            const isUserMessage = message.role === 'user'
            const isLastUserMessage = isUserMessage && 
              index === messages.findLastIndex(msg => msg.role === 'user')

            return (
              <div key={message.id} className="group relative">
                <div className="flex items-start gap-3">
                  <Avatar className="flex-shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      {message.role === 'user' ? 'You' : 'AI'}
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
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <FileUpload 
            onFilesChange={setAttachedFiles} 
            disabled={status === 'streaming'}
          />
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Message ChatGPT..."
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