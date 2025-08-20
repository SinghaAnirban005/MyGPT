'use client'

import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  Edit,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Search,
  Library,
  MoreHorizontal,
  Archive,
  Trash2,
  Edit3,
  Share,
  Menu,
  X,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatOptions } from './chat-options'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SidebarOptions } from './sidebar-options'

interface ChatSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface ChatSidebarProps {
  currentChatId?: string
  onChatSelect: (chatId: string) => void
  onNewChat?: () => void
  collapsed: boolean
  onCollapse: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Sidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  collapsed,
  onCollapse,
  sidebarOpen,
  setSidebarOpen,
}: ChatSidebarProps) {
  const { user } = useUser()
  const { signOut } = useAuth()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user) loadChats()
  }, [user])

  const loadChats = async () => {
    try {
      const res = await fetch('/api/chats')
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats)
      }
    } catch (e) {
      console.error('Error loading chats:', e)
    } finally {
      setLoading(false)
    }
  }

  const createNewChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      if (res.ok) {
        const data = await res.json()
        setChats((prev) => [data.chat, ...prev])
        onChatSelect(data.chat.id)
        // Close sidebar on mobile after creating new chat
        if (isMobile) {
          setSidebarOpen(false)
        }
      }
    } catch (e) {
      console.error('Error creating chat:', e)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setChats((prev) => prev.filter((chat) => chat.id !== chatId))
        if (currentChatId === chatId) {
          const remainingChats = chats.filter((chat) => chat.id !== chatId)
          if (remainingChats.length > 0) {
            onChatSelect(remainingChats[0].id)
          } else {
            createNewChat()
          }
        }
      }
    } catch (e) {
      console.error('Error deleting chat:', e)
    }
  }

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      onCollapse()
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          'flex h-full flex-col bg-neutral-900 transition-all duration-200 ease-in-out',
          isMobile ? 'w-64' : collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center justify-between px-3">
          <Skeleton className="h-6 w-6 rounded" />
          {(!collapsed || isMobile) && <Skeleton className="h-6 w-6 rounded" />}
        </div>

        <div className="px-2 pb-2">
          <Skeleton className={cn('h-10 rounded-lg', collapsed && !isMobile ? 'w-12' : 'w-full')} />
        </div>

        <div className="flex-1 space-y-1 px-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('h-10 rounded-lg', collapsed && !isMobile ? 'w-12' : 'w-full')}
            />
          ))}
        </div>

        <div className="p-2">
          <Skeleton className={cn('h-12 rounded-lg', collapsed && !isMobile ? 'w-12' : 'w-full')} />
        </div>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-neutral-900 transition-all duration-200 ease-in-out',
        'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto',
        isMobile ? 'w-64' : collapsed ? 'w-16' : 'w-64',
        isMobile && !sidebarOpen && '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="flex h-14 items-center justify-between px-3">
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-neutral-700"
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                onClick={isMobile ? undefined : handleSidebarToggle}
              >
                {isMobile ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                  >
                    <path d="M11.2475 18.25C10.6975 18.25 10.175 18.1455 9.67999 17.9365C9.18499 17.7275 8.74499 17.436 8.35999 17.062C7.94199 17.205 7.50749 17.2765 7.05649 17.2765C6.31949 17.2765 5.63749 17.095 5.01049 16.732C4.38349 16.369 3.87749 15.874 3.49249 15.247C3.11849 14.62 2.93149 13.9215 2.93149 13.1515C2.93149 12.8325 2.97549 12.486 3.06349 12.112C2.62349 11.705 2.28249 11.2375 2.04049 10.7095C1.79849 10.1705 1.67749 9.6095 1.67749 9.0265C1.67749 8.4325 1.80399 7.8605 2.05699 7.3105C2.30999 6.7605 2.66199 6.2875 3.11299 5.8915C3.57499 5.4845 4.10849 5.204 4.71349 5.05C4.83449 4.423 5.08749 3.862 5.47249 3.367C5.86849 2.861 6.35249 2.465 6.92449 2.179C7.49649 1.893 8.10699 1.75 8.75599 1.75C9.30599 1.75 9.82849 1.8545 10.3235 2.0635C10.8185 2.2725 11.2585 2.564 11.6435 2.938C12.0615 2.795 12.496 2.7235 12.947 2.7235C13.684 2.7235 14.366 2.905 14.993 3.268C15.62 3.631 16.1205 4.126 16.4945 4.753C16.8795 5.38 17.072 6.0785 17.072 6.8485C17.072 7.1675 17.028 7.514 16.94 7.888C17.38 8.295 17.721 8.768 17.963 9.307C18.205 9.835 18.326 10.3905 18.326 10.9735C18.326 11.5675 18.1995 12.1395 17.9465 12.6895C17.6935 13.2395 17.336 13.718 16.874 14.125C16.423 14.521 15.895 14.796 15.29 14.95C15.169 15.577 14.9105 16.138 14.5145 16.633C14.1295 17.139 13.651 17.535 13.079 17.821C12.507 18.107 11.8965 18.25 11.2475 18.25ZM7.17199 16.1875C7.72199 16.1875 8.20049 16.072 8.60749 15.841L11.7095 14.059C11.8195 13.982 11.8745 13.8775 11.8745 13.7455V12.3265L7.88149 14.62C7.63949 14.763 7.39749 14.763 7.15549 14.62L4.03699 12.8215C4.03699 12.8545 4.03149 12.893 4.02049 12.937C4.02049 12.981 4.02049 13.047 4.02049 13.135C4.02049 13.696 4.15249 14.213 4.41649 14.686C4.69149 15.148 5.07099 15.511 5.55499 15.775C6.03899 16.05 6.57799 16.1875 7.17199 16.1875ZM7.33699 13.498C7.40299 13.531 7.46349 13.5475 7.51849 13.5475C7.57349 13.5475 7.62849 13.531 7.68349 13.498L8.92099 12.7885L4.94449 10.4785C4.70249 10.3355 4.58149 10.121 4.58149 9.835V6.2545C4.03149 6.4965 3.59149 6.8705 3.26149 7.3765C2.93149 7.8715 2.76649 8.4215 2.76649 9.0265C2.76649 9.5655 2.90399 10.0825 3.17899 10.5775C3.45399 11.0725 3.81149 11.4465 4.25149 11.6995L7.33699 13.498ZM11.2475 17.161C11.8305 17.161 12.3585 17.029 12.8315 16.765C13.3045 16.501 13.6785 16.138 13.9535 15.676C14.2285 15.214 14.366 14.697 14.366 14.125V10.561C14.366 10.429 14.311 10.33 14.201 10.264L12.947 9.538V14.1415C12.947 14.4275 12.826 14.642 12.584 14.785L9.46549 16.5835C10.0045 16.9685 10.5985 17.161 11.2475 17.161ZM11.8745 11.122V8.878L10.01 7.822L8.12899 8.878V11.122L10.01 12.178L11.8745 11.122ZM7.05649 5.8585C7.05649 5.5725 7.17749 5.358 7.41949 5.215L10.538 3.4165C9.99899 3.0315 9.40499 2.839 8.75599 2.839C8.17299 2.839 7.64499 2.971 7.17199 3.235C6.69899 3.499 6.32499 3.862 6.04999 4.324C5.78599 4.786 5.65399 5.303 5.65399 5.875V9.4225C5.65399 9.5545 5.70899 9.659 5.81899 9.736L7.05649 10.462V5.8585ZM15.4385 13.7455C15.9885 13.5035 16.423 13.1295 16.742 12.6235C17.072 12.1175 17.237 11.5675 17.237 10.9735C17.237 10.4345 17.0995 9.9175 16.8245 9.4225C16.5495 8.9275 16.192 8.5535 15.752 8.3005L12.6665 6.5185C12.6005 6.4745 12.54 6.458 12.485 6.469C12.43 6.469 12.375 6.4855 12.32 6.5185L11.0825 7.2115L15.0755 9.538C15.1965 9.604 15.2845 9.692 15.3395 9.802C15.4055 9.901 15.4385 10.022 15.4385 10.165V13.7455ZM12.122 5.3635C12.364 5.2095 12.606 5.2095 12.848 5.3635L15.983 7.195C15.983 7.118 15.983 7.019 15.983 6.898C15.983 6.37 15.851 5.8695 15.587 5.3965C15.334 4.9125 14.9655 4.5275 14.4815 4.2415C14.0085 3.9555 13.4585 3.8125 12.8315 3.8125C12.2815 3.8125 11.803 3.928 11.396 4.159L8.29399 5.941C8.18399 6.018 8.12899 6.1225 8.12899 6.2545V7.6735L12.122 5.3635Z"></path>
                  </svg>
                ) : collapsed && isLogoHovered ? (
                  <PanelRight className="h-4 w-4 text-white" />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                  >
                    <path d="M11.2475 18.25C10.6975 18.25 10.175 18.1455 9.67999 17.9365C9.18499 17.7275 8.74499 17.436 8.35999 17.062C7.94199 17.205 7.50749 17.2765 7.05649 17.2765C6.31949 17.2765 5.63749 17.095 5.01049 16.732C4.38349 16.369 3.87749 15.874 3.49249 15.247C3.11849 14.62 2.93149 13.9215 2.93149 13.1515C2.93149 12.8325 2.97549 12.486 3.06349 12.112C2.62349 11.705 2.28249 11.2375 2.04049 10.7095C1.79849 10.1705 1.67749 9.6095 1.67749 9.0265C1.67749 8.4325 1.80399 7.8605 2.05699 7.3105C2.30999 6.7605 2.66199 6.2875 3.11299 5.8915C3.57499 5.4845 4.10849 5.204 4.71349 5.05C4.83449 4.423 5.08749 3.862 5.47249 3.367C5.86849 2.861 6.35249 2.465 6.92449 2.179C7.49649 1.893 8.10699 1.75 8.75599 1.75C9.30599 1.75 9.82849 1.8545 10.3235 2.0635C10.8185 2.2725 11.2585 2.564 11.6435 2.938C12.0615 2.795 12.496 2.7235 12.947 2.7235C13.684 2.7235 14.366 2.905 14.993 3.268C15.62 3.631 16.1205 4.126 16.4945 4.753C16.8795 5.38 17.072 6.0785 17.072 6.8485C17.072 7.1675 17.028 7.514 16.94 7.888C17.38 8.295 17.721 8.768 17.963 9.307C18.205 9.835 18.326 10.3905 18.326 10.9735C18.326 11.5675 18.1995 12.1395 17.9465 12.6895C17.6935 13.2395 17.336 13.718 16.874 14.125C16.423 14.521 15.895 14.796 15.29 14.95C15.169 15.577 14.9105 16.138 14.5145 16.633C14.1295 17.139 13.651 17.535 13.079 17.821C12.507 18.107 11.8965 18.25 11.2475 18.25ZM7.17199 16.1875C7.72199 16.1875 8.20049 16.072 8.60749 15.841L11.7095 14.059C11.8195 13.982 11.8745 13.8775 11.8745 13.7455V12.3265L7.88149 14.62C7.63949 14.763 7.39749 14.763 7.15549 14.62L4.03699 12.8215C4.03699 12.8545 4.03149 12.893 4.02049 12.937C4.02049 12.981 4.02049 13.047 4.02049 13.135C4.02049 13.696 4.15249 14.213 4.41649 14.686C4.69149 15.148 5.07099 15.511 5.55499 15.775C6.03899 16.05 6.57799 16.1875 7.17199 16.1875ZM7.33699 13.498C7.40299 13.531 7.46349 13.5475 7.51849 13.5475C7.57349 13.5475 7.62849 13.531 7.68349 13.498L8.92099 12.7885L4.94449 10.4785C4.70249 10.3355 4.58149 10.121 4.58149 9.835V6.2545C4.03149 6.4965 3.59149 6.8705 3.26149 7.3765C2.93149 7.8715 2.76649 8.4215 2.76649 9.0265C2.76649 9.5655 2.90399 10.0825 3.17899 10.5775C3.45399 11.0725 3.81149 11.4465 4.25149 11.6995L7.33699 13.498ZM11.2475 17.161C11.8305 17.161 12.3585 17.029 12.8315 16.765C13.3045 16.501 13.6785 16.138 13.9535 15.676C14.2285 15.214 14.366 14.697 14.366 14.125V10.561C14.366 10.429 14.311 10.33 14.201 10.264L12.947 9.538V14.1415C12.947 14.4275 12.826 14.642 12.584 14.785L9.46549 16.5835C10.0045 16.9685 10.5985 17.161 11.2475 17.161ZM11.8745 11.122V8.878L10.01 7.822L8.12899 8.878V11.122L10.01 12.178L11.8745 11.122ZM7.05649 5.8585C7.05649 5.5725 7.17749 5.358 7.41949 5.215L10.538 3.4165C9.99899 3.0315 9.40499 2.839 8.75599 2.839C8.17299 2.839 7.64499 2.971 7.17199 3.235C6.69899 3.499 6.32499 3.862 6.04999 4.324C5.78599 4.786 5.65399 5.303 5.65399 5.875V9.4225C5.65399 9.5545 5.70899 9.659 5.81899 9.736L7.05649 10.462V5.8585ZM15.4385 13.7455C15.9885 13.5035 16.423 13.1295 16.742 12.6235C17.072 12.1175 17.237 11.5675 17.237 10.9735C17.237 10.4345 17.0995 9.9175 16.8245 9.4225C16.5495 8.9275 16.192 8.5535 15.752 8.3005L12.6665 6.5185C12.6005 6.4745 12.54 6.458 12.485 6.469C12.43 6.469 12.375 6.4855 12.32 6.5185L11.0825 7.2115L15.0755 9.538C15.1965 9.604 15.2845 9.692 15.3395 9.802C15.4055 9.901 15.4385 10.022 15.4385 10.165V13.7455ZM12.122 5.3635C12.364 5.2095 12.606 5.2095 12.848 5.3635L15.983 7.195C15.983 7.118 15.983 7.019 15.983 6.898C15.983 6.37 15.851 5.8695 15.587 5.3965C15.334 4.9125 14.9655 4.5275 14.4815 4.2415C14.0085 3.9555 13.4585 3.8125 12.8315 3.8125C12.2815 3.8125 11.803 3.928 11.396 4.159L8.29399 5.941C8.18399 6.018 8.12899 6.1225 8.12899 6.2545V7.6735L12.122 5.3635Z"></path>
                  </svg>
                )}
              </div>
            </TooltipTrigger>
            {!isMobile && collapsed && <TooltipContent side="right">Expand sidebar</TooltipContent>}
          </Tooltip>
        </div>

        {isMobile && sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:bg-neutral-700 hover:text-gray-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Close sidebar</TooltipContent>
          </Tooltip>
        )}

        {(!collapsed || isMobile) && !isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCollapse}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:bg-neutral-700 hover:text-gray-400"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Close sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onNewChat ?? createNewChat}
              variant="ghost"
              size="sm"
              className={cn(
                'h-9 w-full justify-start text-white hover:bg-neutral-700 hover:text-white',
                collapsed && !isMobile ? 'justify-left px-0' : 'px-3'
              )}
            >
              <Edit className="h-4 w-4" />
              {(!collapsed || isMobile) && <span className="ml-2">New chat</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && !isMobile && <TooltipContent side="right">New chat</TooltipContent>}
        </Tooltip>
      </div>

      <div className="px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-9 w-full justify-start text-white hover:bg-neutral-700 hover:text-white',
                collapsed && !isMobile ? 'justify-left px-0' : 'px-3'
              )}
            >
              <Search className="h-4 w-4" />
              {(!collapsed || isMobile) && <span className="ml-2">Search chats</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && !isMobile && <TooltipContent side="right">Search chats</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-9 w-full justify-start text-white hover:bg-neutral-700 hover:text-white',
                collapsed && !isMobile ? 'justify-left px-0' : 'px-3'
              )}
            >
              <Library className="h-4 w-4" />
              {(!collapsed || isMobile) && <span className="ml-2">Library</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && !isMobile && <TooltipContent side="right">Library</TooltipContent>}
        </Tooltip>
      </div>

      <div className="mt-4 flex-1 overflow-hidden">
        {(!collapsed || isMobile) && chats.length > 0 && (
          <>
            <div className="px-3 pb-2">
              <div className="px-2 text-sm font-medium tracking-wider text-gray-400">Chats</div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <div className="space-y-1">
                {chats.map((chat) => {
                  const isActive = currentChatId === chat.id
                  const isHovered = hoveredChatId === chat.id
                  return (
                    <div
                      key={chat.id}
                      className="group relative"
                      onMouseEnter={() => setHoveredChatId(chat.id)}
                      onMouseLeave={() => setHoveredChatId(null)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'group relative h-9 w-full justify-between px-3 text-left text-gray-300 hover:bg-neutral-700 hover:text-white',
                          isActive && 'bg-neutral-800 text-white'
                        )}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <span className="flex-1 truncate pr-2 text-left text-sm">{chat.title}</span>

                        <div
                          className={cn(
                            'absolute top-1/2 right-2 -translate-y-1/2 transform transition-opacity',
                            isHovered || isActive ? 'opacity-100' : 'opacity-0'
                          )}
                        >
                          <ChatOptions />
                        </div>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {collapsed && !isMobile && <div className="flex-1" />}
      </div>

      <div className="p-2">
        <SidebarOptions collapsed={collapsed && !isMobile} />
      </div>
    </aside>
  )
}
