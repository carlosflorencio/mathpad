interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal">
      <h2 className="text-lg mb-4">About MathPad</h2>

      <div className="space-y-4 text-[var(--text-color)]">
        <div className="text-center py-4">
          <div className="mb-4 flex justify-center">
            <img src="/mathpad/logo.png" alt="MathPad Logo" width={80} height={80} />
          </div>
          <h3 className="text-xl font-semibold">MathPad</h3>
        </div>

        <div className="border-t border-[var(--ui-border-color)] pt-4">
          <p className="text-sm text-[var(--text-muted)] mb-3">
            A powerful calculator with support for variables, units, and real-time computation.
          </p>
        </div>

        <div className="bg-[var(--bg-input)] p-4 rounded space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Features</h4>
            <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc list-inside">
              <li>Real-time calculation with variables</li>
              <li>Unit conversion and formatting</li>
              <li>Multi-note organization</li>
              <li>Folder sync (Chrome, Edge, Safari)</li>
              <li>Share notes via URL</li>
              <li>Dark and light themes</li>
              <li>Keyboard shortcuts</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--ui-border-color)] pt-4">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Currency exchange rates are updated daily.{" "}
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--text-color)]"
            >
              Rates By Exchange Rate API
            </a>
          </p>
        </div>
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
