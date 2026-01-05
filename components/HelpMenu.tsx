"use client"

interface HelpMenuProps {
  onClose: () => void
  onSelectKeybindings: () => void
  onSelectSyntax: () => void
  onSelectFolderSync: () => void
  onSelectAbout: () => void
}

export function HelpMenu({
  onClose,
  onSelectKeybindings,
  onSelectSyntax,
  onSelectFolderSync,
  onSelectAbout,
}: HelpMenuProps) {
  const handleItemClick = (handler: () => void) => {
    handler()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} style={{ background: "transparent" }} />
      <div
        className="dropdown-menu"
        style={{
          position: "fixed",
          bottom: "4.5rem",
          right: "1rem",
          top: "auto",
          left: "auto",
          marginTop: 0,
        }}
      >
        <button
          onClick={() => handleItemClick(onSelectKeybindings)}
          className="dropdown-item w-full text-left"
        >
          Keyboard Shortcuts
        </button>
        <button
          onClick={() => handleItemClick(onSelectSyntax)}
          className="dropdown-item w-full text-left"
        >
          Editor Syntax
        </button>
        <button
          onClick={() => handleItemClick(onSelectFolderSync)}
          className="dropdown-item w-full text-left"
        >
          Folder Sync
        </button>
        <button
          onClick={() => handleItemClick(onSelectAbout)}
          className="dropdown-item w-full text-left"
        >
          About MathPad
        </button>
      </div>
    </>
  )
}
