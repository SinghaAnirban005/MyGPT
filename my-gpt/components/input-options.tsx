'use client'
import { Button } from '@/components/ui/button'
import { Plus, Image as ImageIcon, FileText, Search, Settings, Video, Archive } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useRef } from 'react'
import { uploadFile } from '@uploadcare/upload-client'

interface InputOptionsProps {
  onFileUpload: (file: any) => void
}

export function InputOptions({ onFileUpload }: InputOptionsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const archiveInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadFile(file, {
        publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || 'demopublickey',
        store: 'auto',
        metadata: {
          originalName: file.name,
        },
      })

      const fileData = {
        name: file.name,
        url: result.cdnUrl,
        cdnUrl: result.cdnUrl,
        mimeType: file.type,
        size: file.size,
        uuid: result.uuid,
      }

      onFileUpload(fileData)
      event.target.value = ''
    } catch (error) {
      console.error('Upload failed:', error)

      alert('File upload failed. Please try again.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:bg-gray-500 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-48 border-gray-700 bg-neutral-700 text-white"
        >
          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="mr-2 h-4 w-4 text-white" />
            Images
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
            onClick={() => documentInputRef.current?.click()}
          >
            <FileText className="mr-2 h-4 w-4 text-white" />
            Documents
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
            onClick={() => mediaInputRef.current?.click()}
          >
            <Video className="mr-2 h-4 w-4 text-white" />
            Media Files
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white"
            onClick={() => archiveInputRef.current?.click()}
          >
            <Archive className="mr-2 h-4 w-4 text-white" />
            Archives
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-600" />

          <DropdownMenuItem className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white">
            <Search className="mr-2 h-4 w-4 text-white" />
            Search web
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer text-white hover:bg-neutral-600 hover:text-white focus:bg-neutral-600 focus:text-white">
            <Settings className="mr-2 h-4 w-4 text-white" />
            Custom instructions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.ppt,.xls,.rtf,.odt,.ods,.odp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <input
        ref={mediaInputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.avi,.mov,.wmv,.flv,.webm,.mp3,.wav,.ogg,.aac,.flac"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <input
        ref={archiveInputRef}
        type="file"
        accept=".zip,.rar,.7z,.tar,.gz,.bz2"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  )
}
