'use client'
import { Button } from "@/components/ui/button"
import { Plus, Image as ImageIcon, FileText, Search, Settings, Video, Music, Archive } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useRef } from "react"
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
      console.log('Uploading file:', file.name, file.type, file.size)
      
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

      console.log('File uploaded successfully:', fileData)
      onFileUpload(fileData)
      event.target.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
      // You can add toast notification here if you have one
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
            onClick={() => documentInputRef.current?.click()}
          >
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </DropdownMenuItem>

          <DropdownMenuItem
            className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
            onClick={() => mediaInputRef.current?.click()}
          >
            <Video className="h-4 w-4 mr-2" />
            Media Files
          </DropdownMenuItem>

          <DropdownMenuItem
            className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
            onClick={() => archiveInputRef.current?.click()}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archives
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-600" />
          
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

      {/* Image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Document input */}
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.ppt,.xls,.rtf,.odt,.ods,.odp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Media input */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.avi,.mov,.wmv,.flv,.webm,.mp3,.wav,.ogg,.aac,.flac"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Archive input */}
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