import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export const runtime = 'edge'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    const modelMessages = messages.map((message: any) => ({
      role: message.role,
      content: message.parts
        ?.filter((part: any) => part.type === 'text')
        ?.map((part: any) => part.text)
        ?.join('') || message.content || ''
    }))
    
    const groqModel = groq('llama-3.1-8b-instant')
    
    const result = await streamText({
      model: groqModel,
      messages: modelMessages,
      temperature: 0.7,
    })
    
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}