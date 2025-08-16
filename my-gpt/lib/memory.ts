import { MemoryClient } from 'mem0ai'

export interface MemoryConfig {
  apiKey: string
  userId: string
}

export interface ConversationMemory {
  facts: string[]
  preferences: string[]
  context: string[]
}

export class ChatMemoryManager {
  private memoryClient: MemoryClient
  private userId: string
  private maxContextTokens: number
  private maxMessagesInContext: number

  constructor(config: MemoryConfig) {
    if (!config.apiKey) {
      throw new Error('MEM0_API_KEY is required')
    }

    this.memoryClient = new MemoryClient({
      apiKey: config.apiKey,
    })
    this.userId = config.userId
    this.maxContextTokens = 4000
    this.maxMessagesInContext = 20
  }

  // Store important information in long-term memory
  async storeMemory(messages: any[], conversationId?: string): Promise<void> {
    try {
      // Extract meaningful conversation content for memory storage
      const conversationText = this.extractConversationText(messages)

      if (conversationText.length > 100) {
        await this.memoryClient.add(
          [
            {
              role: 'user',
              content: conversationText,
            },
          ],
          {
            user_id: this.userId,
            metadata: {
              conversation_id: conversationId,
              timestamp: new Date().toISOString(),
              message_count: messages.length,
              source: 'chat_session',
            },
          }
        )
        console.log(`Memory stored for user ${this.userId}: ${conversationText.length} characters`)
      }
    } catch (error) {
      console.error('Error storing memory for user', this.userId, ':', error)
    }
  }

  // Retrieve relevant memories based on current query
  async getRelevantMemories(query: string, limit: number = 5): Promise<string[]> {
    try {
      const memories = await this.memoryClient.search(query, {
        user_id: this.userId,
        limit: limit,
      })

      const relevantMemories = memories
        .map((memory: any) => memory.memory || memory.text || '')
        .filter(Boolean)
        .slice(0, limit)

      console.log(`Retrieved ${relevantMemories.length} relevant memories for user ${this.userId}`)
      return relevantMemories
    } catch (error) {
      console.error('Error retrieving memories for user', this.userId, ':', error)
      return []
    }
  }

  // Get all memories for a user (for context enrichment)
  async getAllMemories(): Promise<ConversationMemory> {
    try {
      const memories = await this.memoryClient.getAll({
        user_id: this.userId,
      })

      // Categorize memories with better logic
      const facts: string[] = []
      const preferences: string[] = []
      const context: string[] = []

      memories.forEach((memory: any) => {
        const text = memory.memory || memory.text || ''
        const lowerText = text.toLowerCase()

        // Better categorization logic
        if (
          lowerText.includes('prefer') ||
          lowerText.includes('like') ||
          lowerText.includes('dislike') ||
          lowerText.includes('love') ||
          lowerText.includes('hate') ||
          lowerText.includes('favorite')
        ) {
          preferences.push(text)
        } else if (
          lowerText.includes(' is ') ||
          lowerText.includes(' are ') ||
          lowerText.includes(' was ') ||
          lowerText.includes(' were ') ||
          lowerText.includes('name is') ||
          lowerText.includes('work') ||
          lowerText.includes('live') ||
          lowerText.includes('age')
        ) {
          facts.push(text)
        } else {
          context.push(text)
        }
      })

      console.log(
        `Retrieved all memories for user ${this.userId}: ${facts.length} facts, ${preferences.length} preferences, ${context.length} context`
      )
      return { facts, preferences, context }
    } catch (error) {
      console.error('Error getting all memories for user', this.userId, ':', error)
      return { facts: [], preferences: [], context: [] }
    }
  }

  // Manage context window by keeping only recent messages
  manageContextWindow(messages: any[]): any[] {
    if (messages.length <= this.maxMessagesInContext) {
      return messages
    }

    // Keep system message (if any) and recent messages
    const systemMessages = messages.filter((msg) => msg.role === 'system')
    const otherMessages = messages.filter((msg) => msg.role !== 'system')

    // Take the most recent messages
    const recentMessages = otherMessages.slice(-this.maxMessagesInContext)

    console.log(
      `Context window managed: ${messages.length} -> ${systemMessages.length + recentMessages.length} messages`
    )
    return [...systemMessages, ...recentMessages]
  }

  // Create enriched system prompt with memory context
  async createEnrichedSystemPrompt(basePrompt: string, currentQuery?: string): Promise<string> {
    try {
      let enrichedPrompt = basePrompt

      // Get relevant memories if we have a current query
      if (currentQuery) {
        const relevantMemories = await this.getRelevantMemories(currentQuery, 3)
        if (relevantMemories.length > 0) {
          enrichedPrompt += '\n\nRelevant context from previous conversations:'
          relevantMemories.forEach((memory, index) => {
            enrichedPrompt += `\n${index + 1}. ${memory}`
          })
        }
      }

      // Get user preferences and facts
      const allMemories = await this.getAllMemories()

      if (allMemories.preferences.length > 0) {
        enrichedPrompt += '\n\nUser preferences:'
        allMemories.preferences.slice(0, 3).forEach((pref, index) => {
          enrichedPrompt += `\n- ${pref}`
        })
      }

      if (allMemories.facts.length > 0) {
        enrichedPrompt += '\n\nKnown facts about user:'
        allMemories.facts.slice(0, 3).forEach((fact, index) => {
          enrichedPrompt += `\n- ${fact}`
        })
      }

      // Add instructions for memory usage
      enrichedPrompt +=
        "\n\nPlease use this context to provide more personalized and relevant responses. Reference past conversations naturally when appropriate, but don't mention that you're using stored memory unless specifically asked."

      console.log(
        `Enriched system prompt created for user ${this.userId}: ${enrichedPrompt.length} characters`
      )
      return enrichedPrompt
    } catch (error) {
      console.error('Error creating enriched prompt for user', this.userId, ':', error)
      return basePrompt
    }
  }

  // Delete old memories to manage storage
  async cleanupOldMemories(daysOld: number = 30): Promise<number> {
    try {
      const memories = await this.memoryClient.getAll({
        user_id: this.userId,
      })

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      let deletedCount = 0
      for (const memory of memories) {
        if (
          daysOld === 0 ||
          (memory.metadata?.timestamp && new Date(memory.metadata.timestamp) < cutoffDate)
        ) {
          try {
            await this.memoryClient.delete(memory.id)
            deletedCount++
          } catch (deleteError) {
            console.error(`Error deleting memory ${memory.id}:`, deleteError)
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} memories for user ${this.userId}`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up memories for user', this.userId, ':', error)
      return 0
    }
  }

  // private estimateTokens(text: string): number {
  //   return Math.ceil(text.length / 4) // Rough estimate: 1 token ≈ 4 characters
  // }

  // Extract conversation text for memory storage
  private extractConversationText(messages: any[]): string {
    return messages
      .map((msg) => {
        if (msg.parts) {
          return msg.parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => `${msg.role}: ${part.text}`)
            .join('\n')
        }
        return `${msg.role}: ${msg.content || ''}`
      })
      .join('\n')
  }

  // Get memory statistics
  async getMemoryStats(): Promise<{
    totalMemories: number
    facts: number
    preferences: number
    context: number
    lastUpdated: string | null
  }> {
    try {
      const allMemories = await this.getAllMemories()
      const memories = await this.memoryClient.getAll({
        user_id: this.userId,
      })

      const lastUpdated =
        memories.length > 0
          ? memories
              .reduce((latest, memory) => {
                const memoryDate = memory.metadata?.timestamp
                  ? new Date(memory.metadata.timestamp)
                  : new Date(0)
                return memoryDate > latest ? memoryDate : latest
              }, new Date(0))
              .toISOString()
          : null

      return {
        totalMemories: memories.length,
        facts: allMemories.facts.length,
        preferences: allMemories.preferences.length,
        context: allMemories.context.length,
        lastUpdated,
      }
    } catch (error) {
      console.error('Error getting memory stats for user', this.userId, ':', error)
      return {
        totalMemories: 0,
        facts: 0,
        preferences: 0,
        context: 0,
        lastUpdated: null,
      }
    }
  }
}
