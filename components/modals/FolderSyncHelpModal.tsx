interface FolderSyncHelpModalProps {
  onClose: () => void
}

export function FolderSyncHelpModal({ onClose }: FolderSyncHelpModalProps) {
  return (
    <div className="modal">
      <h2 className="text-lg mb-4">Folder Sync</h2>
      <div className="space-y-4 text-[var(--text-color)]">
        <div>
          <h3 className="font-semibold mb-2">What is Folder Sync?</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Sync your notes with a folder on your computer. Notes are saved as{" "}
            <code className="px-1 py-0.5 bg-[var(--bg-input)] rounded">.json</code> files and
            automatically kept in sync.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">How it works</h3>
          <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
            <li>
              <strong>Choose a folder:</strong> Click &quot;Open Folder&quot; to select where notes
              should be saved
            </li>
            <li>
              <strong>Auto-sync:</strong> Changes sync automatically every 10 seconds and when you
              switch back to the app
            </li>
            <li>
              <strong>Edit anywhere:</strong> Open and edit the .json files with any text editor
            </li>
            <li>
              <strong>Always in the app:</strong> Notes are always saved in your browser first, so
              the app works offline
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">File Format</h3>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Each note is saved as{" "}
            <code className="px-1 py-0.5 bg-[var(--bg-input)] rounded">note-name.json</code>:
          </p>
          <pre className="text-xs bg-[var(--bg-input)] p-3 rounded overflow-x-auto">
            {`{
  "version": "1.0",
  "id": "...",
  "name": "My Note",
  "content": "note content..."
}`}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-2">External Changes</h3>
          <p className="text-sm text-[var(--text-muted)]">
            If you edit or delete files outside the app, MathPad will detect changes and ask you
            what to do. When conflicts occur, the newest version (by timestamp) wins.
          </p>
        </div>

        <div className="bg-[var(--bg-input)] p-3 rounded">
          <p className="text-sm text-[var(--text-muted)]">
            <strong>Browser support:</strong> This feature requires Chrome 86+, Edge 86+, or Safari
            15.2+. Firefox is not currently supported.
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--bg-button-hover)] rounded"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
