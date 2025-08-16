'use client'
import { Button } from "@/components/ui/button"
import { Plus, Image as ImageIcon, FileText, Search, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRef } from "react"
import { uploadFile } from '@uploadcare/upload-client'

interface InputOptionsProps {
  onFileUpload: (file: any) => void
}

export function InputOptions({ onFileUpload }: InputOptionsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadFile(file, {
        publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || 'demopublickey',
        store: 'auto',
        metadata: {
          originalName: file.name
        }
      })

      const fileData = {
        name: file.name,
        url: result.cdnUrl,
        cdnUrl: result.cdnUrl,
        mimeType: file.type,
        size: file.size,
        uuid: result.uuid
      }

      onFileUpload(fileData)
      
      event.target.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-neutral-700 text-white border-gray-700">
          <DropdownMenuItem
            className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Images
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-4 w-4 mr-2" />
            Files
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700">
            <Search className="h-4 w-4 mr-2" />
            Search web
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700">
            <Settings className="h-4 w-4 mr-2" />
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
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  )
}