import { useState, useEffect, useMemo } from "react"
import { CheckIcon, CopyIcon, ChevronDownIcon } from "@/components/icons"
import { exportAsText } from "@/lib/export/textExport"
import { evaluateDocument } from "@/lib/engine"
import { Preferences } from "@/lib/preferences/Preferences"

interface ShareModalProps {
  url: string
  content: string
  preferences: Preferences
  onClose: () => void
}

export function ShareModal({ url, content, preferences, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)
  const [showTextExport, setShowTextExport] = useState(false)

  // Only compute results when text export is expanded
  const formattedResults = useMemo(() => {
    if (!showTextExport) return []
    try {
      return evaluateDocument(content, preferences).map((e) => e.formatted)
    } catch (error) {
      console.error("Error computing results for export:", error)
      return []
    }
  }, [showTextExport, content, preferences])

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  useEffect(() => {
    if (textCopied) {
      const timer = setTimeout(() => setTextCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [textCopied])

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
  }

  const handleCopyText = () => {
    const textExport = exportAsText(content, formattedResults)
    navigator.clipboard.writeText(textExport)
    setTextCopied(true)
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

      <div className="mt-4">
        <button
          onClick={() => setShowTextExport(!showTextExport)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded border border-[var(--ui-border-color)] transition-colors"
        >
          <span>Share as Text</span>
          <span
            className="transition-transform"
            style={{ transform: showTextExport ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDownIcon />
          </span>
        </button>

        {showTextExport && (
          <div className="mt-2 border border-[var(--ui-border-color)] rounded p-3">
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Copy your note with results in a text format that can be pasted into other apps:
            </p>
            <div className="relative">
              <textarea
                value={exportAsText(content, formattedResults)}
                readOnly
                className="w-full h-32 px-3 py-2 bg-[var(--bg-input)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] font-mono text-xs resize-none"
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.select()
                }}
              />
              <button
                onClick={handleCopyText}
                className="mt-2 w-full px-4 py-2 bg-[var(--bg-button-hover)] text-[var(--text-color)] rounded border border-[var(--ui-border-color)] hover:bg-[var(--ui-border-color)] transition-colors"
              >
                {textCopied ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckIcon />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CopyIcon />
                    Copy Text
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
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
