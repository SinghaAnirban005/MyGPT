import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { ChatService } from '@/lib/chatService'

const chatService = new ChatService()

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const chats = await chatService.getUserChats(userId)

    console.log('All chats -> ', chats)

    return Response.json({
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        isShared: chat.isShared,
        shareToken: chat.shareToken,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        lastMessageAt: chat.lastMessageAt,
        messageCount: chat.messages.length,
      })),
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)

    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { title } = await req.json()
    const chat = await chatService.createChat(userId, title)

    return Response.json({ chat })
  } catch (error) {
    console.error('Error creating chat:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
