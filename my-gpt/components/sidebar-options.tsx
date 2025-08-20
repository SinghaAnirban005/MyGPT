'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Settings, HelpCircle, Sparkles, Palette } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  collapsed: boolean
}

export function SidebarOptions({ collapsed }: UserMenuProps) {
  const { signOut } = useAuth()
  const { user } = useUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'flex cursor-pointer items-center rounded-lg p-2 transition-colors hover:bg-neutral-800',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="bg-gray-600 text-xs text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="truncate text-xs text-gray-400">Free</div>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-66 border border-gray-600 bg-neutral-700 text-white shadow-xl shadow-black/40"
      >
        <DropdownMenuItem className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white">
          <Sparkles className="mr-2 h-4 w-4 text-white" />
          <span>Upgrade Plan</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white">
          <Palette className="mr-2 h-4 w-4 text-white" />
          <span>Customize ChatGPT</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white">
          <Settings className="mr-2 h-4 w-4 text-white" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white">
          <HelpCircle className="mr-2 h-4 w-4 text-white" />
          <span>Help</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-600" />

        <DropdownMenuItem
          className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4 text-white" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
