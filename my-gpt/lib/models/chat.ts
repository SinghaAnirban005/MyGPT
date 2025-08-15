export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parts?: Array<{
    type: 'text' | 'file'
    text?: string
    file?: {
      name: string
      url: string
      mediaType: string
      uuid?: string
    }
  }>
  timestamp: Date
}

export interface Chat {
  _id?: string
  id: string
  title: string
  userId: string
  messages: ChatMessage[]
  isShared: boolean
  shareToken?: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt?: Date
}
