import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {

    const { userId } = getAuth(req)

    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()
    console.log('Received messages:', messages)

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

    console.log('Converted messages for model:', JSON.stringify(modelMessages, null, 2))

    const model = groq('meta-llama/llama-4-scout-17b-16e-instruct')
    console.log('Using Llama for text processing')

    const result = await streamText({
      model,
      messages: modelMessages,
      temperature: 0.7,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
