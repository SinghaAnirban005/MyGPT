'use client'
import React, { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Edit, Check, X, RotateCcw } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Chat() {
  const [input, setInput] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  
  const { messages, sendMessage, status, setMessages } = useChat()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || status === 'streaming') return
    
    setInput('')
    
    try {
      await sendMessage({
        text: text
      })
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
    console.log('UPdated message ', updatedMessage)

    const messagesUpToEdit = messages.slice(0, messageIndex)
    const updatedMessages = [...messagesUpToEdit, updatedMessage]

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {

            const textParts = message.parts
              ?.filter((part: any) => part.type === 'text')
              ?.map((part: any) => part.text)
              ?.join('') || ''

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
                        <div className="whitespace-pre-wrap break-words">{textParts}</div>
                        
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
        <form onSubmit={onSubmit} className="flex gap-2">
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
            disabled={status === 'streaming' || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}