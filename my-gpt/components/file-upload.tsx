'use client'

import { useState, useRef } from 'react'
import { Widget } from '@uploadcare/react-widget'
import { Button } from './ui/button'
import { Paperclip, X } from 'lucide-react'
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
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => widgetRef.current?.openDialog()}
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach files</span>
        </Button>

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
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.uuid}
              className="flex items-center gap-2 rounded-md border p-2 text-sm"
            >
              <span className="truncate max-w-[120px]">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => removeFile(file.uuid)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}