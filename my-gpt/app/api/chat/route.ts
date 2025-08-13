import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { ChatMemoryManager } from '@/lib/memory'

export const runtime = 'edge'

const getMemoryManager = (userId: string) => {
  return new ChatMemoryManager({
    apiKey: process.env.MEM0_API_KEY!,
    userId: userId
  })
}

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {

    const { userId } = getAuth(req)

    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, conversationId } = await req.json()
    
    console.log('Received messages for user:', userId, messages.length)

    const memoryManager = getMemoryManager(userId)

    const modelMessages = messages.map((message: any) => {
      let content: any = []

      if (Array.isArray(message.parts)) {
        for (const part of message.parts) {
          if (part.type === 'text' && part.text) {
            content.push({ type: 'text', text: part.text })
          } else if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
            content.push({ type: 'image', image: part.url || part.cdnUrl })
          }
        }
      }

      if (content.length === 0) {
        content = message.content || [{ type: 'text', text: '' }]
      }

      if (content.length === 1 && content[0].type === 'text') {
        content = content[0].text
      }

      return { role: message.role, content }
    })

    const contextManagedMessages = memoryManager.manageContextWindow(modelMessages)
    const latestUserMessage = contextManagedMessages
      .filter(msg => msg.role === 'user')
      .pop()


    const latestQuery = typeof latestUserMessage?.content === 'string' 
      ? latestUserMessage.content 
      : latestUserMessage?.content?.[0]?.text || ''
    

      const baseSystemPrompt = `You are a helpful AI assistant. You have access to context from previous conversations with this user. Use this context to provide more personalized and relevant responses. Remember details about the user's preferences, past conversations, and context to make your responses more helpful.`
    
    const enrichedSystemPrompt = await memoryManager.createEnrichedSystemPrompt(
      baseSystemPrompt, 
      latestQuery
    )

    // Add enriched system message
    const messagesWithMemory = [
      { role: 'system', content: enrichedSystemPrompt },
      ...contextManagedMessages.filter(msg => msg.role !== 'system')
    ]

    console.log('Messages with memory context:', messagesWithMemory.length)
    console.log('System prompt length:', enrichedSystemPrompt.length)
  

    const model = groq('meta-llama/llama-4-scout-17b-16e-instruct')

    const result = await streamText({
      model,
      messages: messagesWithMemory,
      temperature: 0.7,
    })

    setTimeout(async () => {
      try {
        await memoryManager.storeMemory(modelMessages, conversationId)
        console.log('Conversation stored in memory for user:', userId)
      } catch (error) {
        console.error('Failed to store memory:', error)
      }
    }, 0)

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
