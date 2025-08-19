export const hasAttachments = (message: any): boolean => {
  if (message?.files && Array.isArray(message.files) && message.files.length > 0) {
    return true
  }

  if (message.parts) {
    const fileParts = message.parts.filter((part: any) => part.type === 'file' || part.file)
    return fileParts.length > 0
  }

  return false
}
