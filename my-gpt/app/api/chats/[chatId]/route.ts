import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { ChatService } from '@/lib/chatService'

const chatService = new ChatService()

// Get specific chat
export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { chatId } = await params
    console.log('CHAT ID -> ', chatId)

    const chat = await chatService.getChatById(chatId, userId)
    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    return Response.json({ chat })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Update chat
export async function PATCH(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { title, messages } = await req.json()
    const { chatId } = await params

    if (title !== undefined) {
      await chatService.updateChatTitle(chatId, title, userId)
    }

    if (messages !== undefined) {
      await chatService.updateChatMessages(chatId, messages, userId)
    }

    const updatedChat = await chatService.getChatById(chatId, userId)
    return Response.json({ chat: updatedChat })
  } catch (error) {
    console.error('Error updating chat:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Delete chat
export async function DELETE(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { chatId } = await params

    await chatService.deleteChat(chatId, userId)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
