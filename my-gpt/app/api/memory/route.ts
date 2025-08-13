import { getAuth } from '@clerk/nextjs/server'
import { ChatMemoryManager } from '@/lib/memory'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req)
    
    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please sign in' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const memoryManager = new ChatMemoryManager({
      apiKey: process.env.MEM0_API_KEY!,
      userId: clerkUserId
    })
    
    const allMemories = await memoryManager.getAllMemories()
    
    // Transform memories into a more manageable format
    const memories = [
      ...allMemories.facts.map((fact, index) => ({ 
        id: `fact-${index}`,
        memory: fact, 
        type: 'fact',
        timestamp: new Date().toISOString()
      })),
      ...allMemories.preferences.map((pref, index) => ({ 
        id: `pref-${index}`,
        memory: pref, 
        type: 'preference',
        timestamp: new Date().toISOString()
      })),
      ...allMemories.context.map((ctx, index) => ({ 
        id: `ctx-${index}`,
        memory: ctx, 
        type: 'context',
        timestamp: new Date().toISOString()
      }))
    ]
    
    return Response.json({ 
      memories,
      total: memories.length,
      userId: clerkUserId
    })
  } catch (error) {
    console.error('Error fetching memories:', error)
    return Response.json(
      { error: 'Failed to fetch memories' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req)
    
    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please sign in' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const memoryManager = new ChatMemoryManager({
      apiKey: process.env.MEM0_API_KEY!,
      userId: clerkUserId
    })
    
    // Clear all memories for the authenticated user
    await memoryManager.cleanupOldMemories(0) // 0 days = clear all
    
    return Response.json({ 
      success: true, 
      message: 'All memories cleared successfully',
      userId: clerkUserId
    })
  } catch (error) {
    console.error('Error clearing memories:', error)
    return Response.json(
      { error: 'Failed to clear memories' }, 
      { status: 500 }
    )
  }
}