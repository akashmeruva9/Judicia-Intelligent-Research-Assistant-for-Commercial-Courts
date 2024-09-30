'use client'

import { Button } from '@/components/ui/button'
import { IconCheck } from '@tabler/icons-react'
import { CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export const CopyButton = ({ copyContent }: { copyContent: string }) => {
  const [copyClipboard, setCopyClipboard] = useState<boolean>(false)

  const copyUrl = () => {
    navigator.clipboard.writeText(copyContent)
    setCopyClipboard(true)
  }

  useEffect(() => {
    if (copyClipboard) {
      const timer = setTimeout(() => {
        setCopyClipboard(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [copyClipboard])

  return (
    <Button type="submit" size="icon" variant="ghost" onClick={copyUrl}>
      <span className="sr-only">Copy</span>
      {copyClipboard ? (
        <IconCheck className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </Button>
  )
}
