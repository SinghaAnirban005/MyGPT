'use client'
import React, { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Chat() {
  const [input, setInput] = useState('')
  
  const { messages, sendMessage, status } = useChat()

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const textParts = message.parts
              ?.filter((part: any) => part.type === 'text')
              ?.map((part: any) => part.text)
              ?.join('') || ''

            return (
              <div key={message.id} className="flex items-end gap-2">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2">
                  <div className="whitespace-pre-wrap">{textParts}</div>
                </div>
              </div>
            )
          })}
          {status === 'streaming' && (
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700">AI</AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Message ChatGPT..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status === 'streaming'}
          />
          <Button type="submit" size="icon" disabled={status === 'streaming'}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}