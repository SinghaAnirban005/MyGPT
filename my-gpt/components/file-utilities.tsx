import { FileText, File, Image, Video, Music, Archive, Code } from 'lucide-react'

// File type utilities
export const getFileType = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('document') || mimeType.includes('officedocument.wordprocessingml'))
    return 'document'
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheetml')
  )
    return 'spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('presentationml'))
    return 'presentation'
  if (mimeType.startsWith('text/') || mimeType.includes('csv')) return 'text'
  if (
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('html') ||
    mimeType.includes('css')
  )
    return 'code'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
    return 'archive'
  return 'file'
}

export const getFileIcon = (fileType: string, size: string = 'h-6 w-6') => {
  const iconProps = { className: `${size} flex-shrink-0` }

  switch (fileType) {
    case 'image':
      return <Image {...iconProps} />
    case 'video':
      return <Video {...iconProps} />
    case 'audio':
      return <Music {...iconProps} />
    case 'pdf':
      return <FileText {...iconProps} />
    case 'document':
      return <FileText {...iconProps} />
    case 'spreadsheet':
      return <FileText {...iconProps} />
    case 'presentation':
      return <FileText {...iconProps} />
    case 'text':
      return <FileText {...iconProps} />
    case 'code':
      return <Code {...iconProps} />
    case 'archive':
      return <Archive {...iconProps} />
    default:
      return <File {...iconProps} />
  }
}

export const getFileColor = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return 'border-green-500 bg-green-500/10 text-green-400'
    case 'video':
      return 'border-purple-500 bg-purple-500/10 text-purple-400'
    case 'audio':
      return 'border-pink-500 bg-pink-500/10 text-pink-400'
    case 'pdf':
      return 'border-red-500 bg-red-500/10 text-red-400'
    case 'document':
      return 'border-blue-500 bg-blue-500/10 text-blue-400'
    case 'spreadsheet':
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
    case 'presentation':
      return 'border-orange-500 bg-orange-500/10 text-orange-400'
    case 'text':
      return 'border-gray-500 bg-gray-500/10 text-gray-400'
    case 'code':
      return 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
    case 'archive':
      return 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
    default:
      return 'border-gray-500 bg-gray-500/10 text-gray-400'
  }
}

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
