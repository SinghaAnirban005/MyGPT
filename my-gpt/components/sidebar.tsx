'use client'

import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Edit, MessageSquare, PanelLeft, LogOut, SearchCheck, Image } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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
}

export function Sidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  collapsed,
  onCollapse,
}: ChatSidebarProps) {
  const { user } = useUser()
  const { signOut } = useAuth()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)

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
      }
    } catch (e) {
      console.error('Error creating chat:', e)
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          'relative flex h-full flex-col border-r border-gray-700 bg-neutral-900 transition-all duration-300 ease-in-out',
          collapsed ? 'w-[70px]' : 'w-[260px]'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="border-b border-gray-700 p-2">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="p-2">
          <Skeleton className="mb-2 h-6 w-16" />
        </div>
        <div className="flex-1 space-y-2 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        <div className="border-t border-gray-700 p-2">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-gray-700 bg-neutral-900 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      <div className="flex items-center justify-between border-gray-700 p-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
          onClick={collapsed ? onCollapse : undefined}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            className="icon-lg"
          >
            <path d="M11.2475 18.25C10.6975 18.25 10.175 18.1455 9.67999 17.9365C9.18499 17.7275 8.74499 17.436 8.35999 17.062C7.94199 17.205 7.50749 17.2765 7.05649 17.2765C6.31949 17.2765 5.63749 17.095 5.01049 16.732C4.38349 16.369 3.87749 15.874 3.49249 15.247C3.11849 14.62 2.93149 13.9215 2.93149 13.1515C2.93149 12.8325 2.97549 12.486 3.06349 12.112C2.62349 11.705 2.28249 11.2375 2.04049 10.7095C1.79849 10.1705 1.67749 9.6095 1.67749 9.0265C1.67749 8.4325 1.80399 7.8605 2.05699 7.3105C2.30999 6.7605 2.66199 6.2875 3.11299 5.8915C3.57499 5.4845 4.10849 5.204 4.71349 5.05C4.83449 4.423 5.08749 3.862 5.47249 3.367C5.86849 2.861 6.35249 2.465 6.92449 2.179C7.49649 1.893 8.10699 1.75 8.75599 1.75C9.30599 1.75 9.82849 1.8545 10.3235 2.0635C10.8185 2.2725 11.2585 2.564 11.6435 2.938C12.0615 2.795 12.496 2.7235 12.947 2.7235C13.684 2.7235 14.366 2.905 14.993 3.268C15.62 3.631 16.1205 4.126 16.4945 4.753C16.8795 5.38 17.072 6.0785 17.072 6.8485C17.072 7.1675 17.028 7.514 16.94 7.888C17.38 8.295 17.721 8.768 17.963 9.307C18.205 9.835 18.326 10.3905 18.326 10.9735C18.326 11.5675 18.1995 12.1395 17.9465 12.6895C17.6935 13.2395 17.336 13.718 16.874 14.125C16.423 14.521 15.895 14.796 15.29 14.95C15.169 15.577 14.9105 16.138 14.5145 16.633C14.1295 17.139 13.651 17.535 13.079 17.821C12.507 18.107 11.8965 18.25 11.2475 18.25ZM7.17199 16.1875C7.72199 16.1875 8.20049 16.072 8.60749 15.841L11.7095 14.059C11.8195 13.982 11.8745 13.8775 11.8745 13.7455V12.3265L7.88149 14.62C7.63949 14.763 7.39749 14.763 7.15549 14.62L4.03699 12.8215C4.03699 12.8545 4.03149 12.893 4.02049 12.937C4.02049 12.981 4.02049 13.047 4.02049 13.135C4.02049 13.696 4.15249 14.213 4.41649 14.686C4.69149 15.148 5.07099 15.511 5.55499 15.775C6.03899 16.05 6.57799 16.1875 7.17199 16.1875ZM7.33699 13.498C7.40299 13.531 7.46349 13.5475 7.51849 13.5475C7.57349 13.5475 7.62849 13.531 7.68349 13.498L8.92099 12.7885L4.94449 10.4785C4.70249 10.3355 4.58149 10.121 4.58149 9.835V6.2545C4.03149 6.4965 3.59149 6.8705 3.26149 7.3765C2.93149 7.8715 2.76649 8.4215 2.76649 9.0265C2.76649 9.5655 2.90399 10.0825 3.17899 10.5775C3.45399 11.0725 3.81149 11.4465 4.25149 11.6995L7.33699 13.498ZM11.2475 17.161C11.8305 17.161 12.3585 17.029 12.8315 16.765C13.3045 16.501 13.6785 16.138 13.9535 15.676C14.2285 15.214 14.366 14.697 14.366 14.125V10.561C14.366 10.429 14.311 10.33 14.201 10.264L12.947 9.538V14.1415C12.947 14.4275 12.826 14.642 12.584 14.785L9.46549 16.5835C10.0045 16.9685 10.5985 17.161 11.2475 17.161ZM11.8745 11.122V8.878L10.01 7.822L8.12899 8.878V11.122L10.01 12.178L11.8745 11.122ZM7.05649 5.8585C7.05649 5.5725 7.17749 5.358 7.41949 5.215L10.538 3.4165C9.99899 3.0315 9.40499 2.839 8.75599 2.839C8.17299 2.839 7.64499 2.971 7.17199 3.235C6.69899 3.499 6.32499 3.862 6.04999 4.324C5.78599 4.786 5.65399 5.303 5.65399 5.875V9.4225C5.65399 9.5545 5.70899 9.659 5.81899 9.736L7.05649 10.462V5.8585ZM15.4385 13.7455C15.9885 13.5035 16.423 13.1295 16.742 12.6235C17.072 12.1175 17.237 11.5675 17.237 10.9735C17.237 10.4345 17.0995 9.9175 16.8245 9.4225C16.5495 8.9275 16.192 8.5535 15.752 8.3005L12.6665 6.5185C12.6005 6.4745 12.54 6.458 12.485 6.469C12.43 6.469 12.375 6.4855 12.32 6.5185L11.0825 7.2115L15.0755 9.538C15.1965 9.604 15.2845 9.692 15.3395 9.802C15.4055 9.901 15.4385 10.022 15.4385 10.165V13.7455ZM12.122 5.3635C12.364 5.2095 12.606 5.2095 12.848 5.3635L15.983 7.195C15.983 7.118 15.983 7.019 15.983 6.898C15.983 6.37 15.851 5.8695 15.587 5.3965C15.334 4.9125 14.9655 4.5275 14.4815 4.2415C14.0085 3.9555 13.4585 3.8125 12.8315 3.8125C12.2815 3.8125 11.803 3.928 11.396 4.159L8.29399 5.941C8.18399 6.018 8.12899 6.1225 8.12899 6.2545V7.6735L12.122 5.3635Z"></path>
          </svg>
        </div>

        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCollapse}
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-neutral-900 hover:bg-neutral-600"
              >
                {collapsed ? null : <PanelLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="border-gray-700 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onNewChat ?? createNewChat}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 text-white hover:bg-neutral-700 hover:text-white focus:text-white',
                collapsed ? 'justify-center px-0' : 'px-3'
              )}
            >
              <Edit className="h-4 w-4" />
              {!collapsed && <span>New chat</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">New chat</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 text-white hover:bg-neutral-700 hover:text-white focus:text-white',
                collapsed ? 'justify-center px-0' : 'px-3'
              )}
            >
              <SearchCheck className="h-4 w-4" />
              {!collapsed && <span>Search Chats</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Search Chats</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'h-auto w-full justify-start gap-2 rounded-md text-left text-white hover:bg-neutral-700 hover:text-white focus:text-white',
                collapsed ? 'justify-center px-0' : 'px-3'
              )}
            >
              <Image className="h-4 w-4" />
              {!collapsed && <span>Library</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Library</TooltipContent>}
        </Tooltip>
      </div>

      <div className="flex-1 overflow-auto">
        {!collapsed && <div className="mt-2 p-2 text-sm font-medium text-gray-400">Chats</div>}
        {chats.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
            {!collapsed && (
              <>
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Start a new conversation</p>
              </>
            )}
          </div>
        ) : (
          <div className="space py-2">
            {chats.map((chat) => {
              const isActive = currentChatId === chat.id
              return (
                <Tooltip key={chat.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-auto w-full justify-start gap-2 rounded-md text-left hover:bg-neutral-700',
                        isActive ? 'bg-neutral-800' : '',
                        collapsed ? 'justify-center px-0' : 'px-3'
                      )}
                      onClick={() => onChatSelect(chat.id)}
                    >
                      {!collapsed && <span className="truncate text-gray-300">{chat.title}</span>}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">{chat.title}</TooltipContent>}
                </Tooltip>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                'text-gray-200 hover:bg-neutral-700',
                collapsed ? 'justify-center' : ''
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-gray-600 text-xs text-gray-200">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="truncate text-xs text-gray-400">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[240px] rounded-md border border-gray-600 bg-neutral-700 shadow-lg"
            align="start"
            side="top"
          >
            <DropdownMenuItem
              className={cn(
                'flex items-center text-gray-200 hover:bg-neutral-600 focus:bg-neutral-600',
                'cursor-pointer focus:text-gray-200'
              )}
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4 text-gray-400" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
