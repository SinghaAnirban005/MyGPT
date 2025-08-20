'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Share, Archive, Trash2, Edit3 } from 'lucide-react'


export function ChatOptions() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-neutral-600 flex-shrink-0"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(prev => !prev)
          }}
        >
          <MoreHorizontal className="h-3 w-3 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        side="right"
        className="w-48 border border-gray-600 bg-neutral-700 text-white shadow-xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem 
          className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
        >
          <Share className="mr-2 h-4 w-4 text-white" />
          <span>Share</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
        >
          <Edit3 className="mr-2 h-4 w-4 text-white" />
          <span>Rename</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
        >
          <Archive className="mr-2 h-4 w-4 text-white" />
          <span>Archive</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-600" />

        <DropdownMenuItem 
          className="cursor-pointer text-red-400 hover:bg-neutral-600 hover:text-red-300 focus:bg-neutral-600 focus:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-400" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}