"use client"
import { useState, useRef } from 'react'
import { Widget } from '@uploadcare/react-widget'
import { Button } from './ui/button'
import { Paperclip, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesChange: (files: FileData[]) => void
  className?: string
  disabled?: boolean
}

export interface FileData {
  name: string
  url: string
  cdnUrl: string
  mimeType: string
  size: number
  uuid: string
}

export function FileUpload({ onFilesChange, className, disabled }: FileUploadProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const widgetRef = useRef<any>(null)

  const handleUpload = (fileInfo: any) => {
    if (fileInfo) {
      const newFile: FileData = {
        name: fileInfo.name,
        url: fileInfo.originalUrl,
        cdnUrl: fileInfo.cdnUrl,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        uuid: fileInfo.uuid,
      }
      const updatedFiles = [...files, newFile]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    }
  }

  const removeFile = (uuid: string) => {
    const updatedFiles = files.filter((file) => file.uuid !== uuid)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => widgetRef.current?.openDialog()}
            disabled={disabled}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Attach files</TooltipContent>
      </Tooltip>
 
        <Widget
          ref={widgetRef}
          publicKey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || 'demopublickey'}
          onChange={handleUpload}
          tabs="file url"
          previewStep
          clearable
          crop="free"
          multiple={false}
          systemDialog
          inputAcceptTypes="image/*,.pdf,.doc,.docx,.txt"
        />
      {/* </div> */}

      {files.length > 0 && (
        <div className="flex items-center gap-1">
          {files.map((file) => (
            <div
              key={file.uuid}
              className="flex items-center gap-1 rounded-md bg-gray-700 px-2 py-1 text-xs"
            >
              <span className="truncate max-w-[80px] text-gray-300">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-gray-400 hover:text-white"
                onClick={() => removeFile(file.uuid)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}