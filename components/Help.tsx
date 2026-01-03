"use client"

interface HelpProps {
  close: () => void
}

export function Help({ close }: HelpProps) {
  return (
    <div className="modal">
      <h1 className="text-2xl mb-4">Help</h1>
      <div className="overflow-auto max-h-[70vh]">
        <p className="mb-4">Documentation will be added here.</p>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={close} className="cursor-pointer underline text-[var(--text-color)]">
          Close
        </button>
      </div>
    </div>
  )
}
