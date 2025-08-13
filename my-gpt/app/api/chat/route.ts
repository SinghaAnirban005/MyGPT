import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export const runtime = 'edge'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    console.log('Received messages:', messages)
    
    const modelMessages = messages.map((message: any) => {
      let content: any = []
      console.log('MESSAGES -> ', message)
      if (message.parts && Array.isArray(message.parts)) {
        message.parts.forEach((part: any) => {
          if (part.type === 'text' && part.text) {
            content.push({
              type: 'text',
              text: part.text
            })
          } else if (part.type === 'file') {
            // Handle file parts (images, documents, etc.)
            const file = part
            if (file.type && file.mediaType.startsWith('image/')) {
              content.push({
                type: 'image',
                image: file.url || file.cdnUrl
              })
            }
          } 
          // else if (part.type === 'image' && part.image) {
          //   // Handle direct image parts
          //   content.push({
          //     type: 'image',
          //     image_url: {
          //       url: part.image.url || part.image
          //     }
          //   })
          // }
        })
      }


      console.log('Content -> ', content)
      
      if (content.length === 0) {
        if (message.content) {
          content = message.content
        } else {
          content = [{ type: 'text', text: '' }]
        }
      }
      
      if (content.length === 1 && content[0].type === 'text') {
        content = content[0].text
      }
      
      return {
        role: message.role,
        content: content
      }
    })
    
    console.log('Converted messages for model:', JSON.stringify(modelMessages, null, 2))

    let model
   
    model = groq('meta-llama/llama-4-scout-17b-16e-instruct')
    console.log('Using Llama for text processing')
    
    const result = await streamText({
      model: model,
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