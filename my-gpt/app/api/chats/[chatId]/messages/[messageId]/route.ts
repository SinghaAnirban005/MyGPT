
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { ChatService } from '@/lib/chatService'
import { ChatMessage } from '@/lib/models/chat'

const chatService = new ChatService()

// Edit/Replace a specific message
export async function PATCH(
  req: NextRequest, 
  { params }: { params: { chatId: string, messageId: string } }
) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { chatId, messageId } = await params
    const body = await req.json()
    const { content, action = 'replace' } = body

    if (action === 'replace') {

      const newMessage: ChatMessage = {
        id: messageId,
        role: 'user',
        content: content,
        parts: [{ type: 'text', text: content }],
        timestamp: new Date()
      }

      const updatedMessages = await chatService.replaceMessageAndRemoveAfter(
        chatId, 
        messageId, 
        newMessage, 
        userId
      )

      return Response.json({ 
        success: true, 
        messages: updatedMessages,
        removedCount: 'Messages after edited message were removed'
      })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error editing message:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Delete a specific message and all after it
export async function DELETE(
  req: NextRequest, 
  { params }: { params: { chatId: string, messageId: string } }
) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { chatId, messageId } = await params

    const updatedMessages = await chatService.removeMessagesFrom(chatId, messageId, userId)

    return Response.json({ 
      success: true, 
      messages: updatedMessages,
      message: 'Message and all subsequent messages removed'
    })

  } catch (error) {
    console.error('Error deleting message:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}