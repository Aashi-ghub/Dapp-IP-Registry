"use client"

import { useState } from 'react'
import { CheckIcon, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyToClipboardProps {
  text: string
  displayText?: string
  className?: string
  iconClassName?: string
  showIcon?: boolean
}

export function CopyToClipboard({
  text,
  displayText,
  className,
  iconClassName,
  showIcon = true
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 font-mono text-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer",
        className
      )}
      title="Click to copy"
    >
      <span>{displayText || text}</span>
      {showIcon && (
        <span className={cn("ml-1", iconClassName)}>
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 opacity-70" />
          )}
        </span>
      )}
    </button>
  )
} 