import { useState, useEffect } from "react"
import { CheckIcon, CopyIcon } from "@/components/icons"

interface ShareModalProps {
  url: string
  onClose: () => void
}

export function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
  }

  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Share Note</h2>

      <p className="text-sm text-[var(--text-muted)] mb-4">
        Share this link with anyone. They can view and import your note.
      </p>

      <div className="mb-4">
        <label className="text-sm font-semibold text-[var(--text-color)] mb-2 block">
          Share URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-3 py-2 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] font-mono text-sm"
            onClick={(e) => {
              const target = e.target as HTMLInputElement
              target.select()
            }}
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[var(--bg-button-hover)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] hover:bg-[var(--ui-border-color)] transition-colors"
          >
            {copied ? (
              <span className="flex items-center gap-2">
                <CheckIcon />
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CopyIcon />
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-input)] p-3 rounded">
        <p className="text-xs text-[var(--text-muted)]">
          <strong>Note:</strong> The link contains your note content encoded in the URL. Anyone with
          this link can view and import your note.
        </p>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
