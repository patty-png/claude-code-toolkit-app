'use client'

import { useState } from 'react'

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <div className="detail-install">
      <div className="detail-install-label">Install</div>
      <pre className="detail-install-cmd">
        <code>{command}</code>
        <button type="button" className="copy-btn" onClick={copy} aria-label="Copy install command">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </pre>
    </div>
  )
}
