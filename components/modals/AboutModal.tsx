interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal" style={{ maxWidth: "500px" }}>
      <h2 className="text-lg mb-4">About MathPad</h2>

      <div className="space-y-4 text-[var(--text-color)]">
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🧮</div>
          <h3 className="text-xl font-semibold mb-1">MathPad</h3>
          <p className="text-sm text-[var(--text-muted)]">Version 0.1.0</p>
        </div>

        <div className="border-t border-[var(--ui-border-color)] pt-4">
          <p className="text-sm text-[var(--text-muted)] mb-3">
            A powerful calculator with support for variables, units, and real-time computation.
            Built with Next.js, React, and TypeScript.
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
          <h4 className="font-semibold text-sm mb-2">Technology Stack</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <strong>Framework:</strong> Next.js 16
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <strong>UI:</strong> React 19
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <strong>Editor:</strong> CodeMirror 6
            </div>
            <div className="p-2 bg-[var(--bg-input)] rounded">
              <strong>Math:</strong> Big.js
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--ui-border-color)] pt-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Built with ❤️ using modern web technologies
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
