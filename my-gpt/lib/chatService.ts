import { connectToDatabase } from './mongodb'
import { Chat, ChatMessage } from './models/chat'
import { nanoid } from 'nanoid'

export class ChatService {
  private async getCollection() {
    const { db } = await connectToDatabase()
    return db.collection<Chat>('chats')
  }

  async createChat(userId: string, title?: string): Promise<Chat> {
    const collection = await this.getCollection()

    const chat: Chat = {
      id: nanoid(),
      title: title || 'New Chat',
      userId,
      messages: [],
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(chat)
    return chat
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const collection = await this.getCollection()

    const chats = await collection
      .find({ userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .toArray()

    return chats
  }

  async getChatById(chatId: string, userId?: string): Promise<Chat | null> {
    const collection = await this.getCollection()

    const query: any = { id: chatId }
    if (userId) {
      query.userId = userId
    }

    return await collection.findOne(query)
  }

  async getChatByShareToken(shareToken: string): Promise<Chat | null> {
    const collection = await this.getCollection()

    return await collection.findOne({
      shareToken,
      isShared: true,
    })
  }

  async updateChatMessages(chatId: string, messages: ChatMessage[], userId: string): Promise<void> {
    const collection = await this.getCollection()

    const existingChat = await collection.findOne({ id: chatId, userId })

    if (!existingChat) {
      await collection.insertOne({
        id: chatId,
        userId,
        messages,
        title: 'New Chat',
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: messages[messages.length - 1]?.timestamp || new Date(),
      })
      return
    }

    const existingMessages = existingChat.messages || []

    // Create a Set of existing message IDs to avoid duplicates
    const existingIds = new Set(existingMessages.map((msg: any) => msg.id))

    // Filter new messages to only include ones not already saved
    const newMessages = messages.filter((msg) => !existingIds.has(msg.id))

    if (newMessages.length > 0) {
      const lastMessage = newMessages[newMessages.length - 1]

      await collection.updateOne(
        { id: chatId, userId },
        {
          $push: { messages: { $each: newMessages } }, // Append new messages
          $set: {
            updatedAt: new Date(),
            lastMessageAt: lastMessage.timestamp || new Date(),
          },
        }
      )
    }
  }

  async updateChatTitle(chatId: string, title: string, userId: string): Promise<void> {
    const collection = await this.getCollection()

    await collection.updateOne(
      { id: chatId, userId },
      {
        $set: {
          title,
          updatedAt: new Date(),
        },
      }
    )
  }

  async shareChat(chatId: string, userId: string): Promise<string> {
    const collection = await this.getCollection()

    const shareToken = nanoid(32)

    await collection.updateOne(
      { id: chatId, userId },
      {
        $set: {
          isShared: true,
          shareToken,
          updatedAt: new Date(),
        },
      }
    )

    return shareToken
  }

  async unshareChat(chatId: string, userId: string): Promise<void> {
    const collection = await this.getCollection()

    await collection.updateOne(
      { id: chatId, userId },
      {
        $unset: {
          shareToken: '',
        },
        $set: {
          isShared: false,
          updatedAt: new Date(),
        },
      }
    )
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const collection = await this.getCollection()

    await collection.deleteOne({ id: chatId, userId })
  }

  async generateChatTitle(messages: ChatMessage[]): Promise<string> {
    const firstUserMessage = messages.find((msg) => msg.role === 'user')
    if (!firstUserMessage) return 'New Chat'

    const content =
      firstUserMessage.content ||
      firstUserMessage.parts
        ?.filter((part) => part.type === 'text')
        ?.map((part) => part.text)
        ?.join(' ') ||
      'New Chat'

    return content.length > 50 ? content.substring(0, 50) + '...' : content
  }
}
