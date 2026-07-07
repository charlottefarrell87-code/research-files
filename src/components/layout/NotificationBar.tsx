'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NotificationBarProps {
  fileId: string
  fileName: string
  projectName: string
  projectId: string
  subProjectId: string | null
  uploadedAt: string
}

export default function NotificationBar({
  fileId,
  fileName,
  projectName,
  projectId,
  subProjectId,
  uploadedAt,
}: NotificationBarProps) {
  const [visible, setVisible] = useState(false)

  // Only show if this file hasn't been dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed_notification')
    if (dismissed !== fileId) {
      setVisible(true)
    }
  }, [fileId])

  function dismiss() {
    localStorage.setItem('dismissed_notification', fileId)
    setVisible(false)
  }

  if (!visible) return null

  const href = subProjectId
    ? `/projects/${projectId}/file/${fileId}`
    : `/projects/${projectId}/file/${fileId}`

  const daysAgo = Math.floor(
    (Date.now() - new Date(uploadedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const timeLabel =
    daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-600 text-white text-sm">
      {/* Pulse dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>

      <span className="font-medium">New research added {timeLabel}:</span>

      <Link
        href={href}
        className="underline underline-offset-2 hover:opacity-80 transition-opacity truncate max-w-xs"
      >
        {fileName}
      </Link>

      <span className="text-brand-200 hidden sm:inline">in {projectName}</span>

      <Link
        href={href}
        className="ml-auto shrink-0 bg-white text-brand-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-brand-50 transition-colors"
      >
        View →
      </Link>

      <button
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-brand-200 hover:text-white transition-colors ml-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
