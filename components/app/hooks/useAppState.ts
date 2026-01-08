import { useState, useCallback } from "react"
import { ShareData } from "@/lib/notes/types"

/**
 * Centralized state management for all modal/dialog visibility
 */
export function useAppState() {
  const [showPreferences, setShowPreferences] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [showKeybindingsModal, setShowKeybindingsModal] = useState(false)
  const [showSyntaxModal, setShowSyntaxModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showNotesMenu, setShowNotesMenu] = useState(false)
  const [showManageNotes, setShowManageNotes] = useState(false)
  const [showFolderSyncHelp, setShowFolderSyncHelp] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [conflictData, setConflictData] = useState<ShareData | null>(null)

  const closeAllDialogs = useCallback(() => {
    setShowPreferences(false)
    setShowKeybindingsModal(false)
    setShowSyntaxModal(false)
    setShowAboutModal(false)
    setShowMenu(false)
    setShowHelpMenu(false)
    setShowNotesMenu(false)
    setShowManageNotes(false)
    setShowFolderSyncHelp(false)
    setShowQuickActions(false)
    setShowShareModal(false)
    setShowOnboarding(false)
  }, [])

  return {
    // State
    showPreferences,
    showHelpMenu,
    showKeybindingsModal,
    showSyntaxModal,
    showAboutModal,
    showMenu,
    showNotesMenu,
    showManageNotes,
    showFolderSyncHelp,
    showQuickActions,
    showShareModal,
    showOnboarding,
    shareUrl,
    conflictData,
    // Setters
    setShowPreferences,
    setShowHelpMenu,
    setShowKeybindingsModal,
    setShowSyntaxModal,
    setShowAboutModal,
    setShowMenu,
    setShowNotesMenu,
    setShowManageNotes,
    setShowFolderSyncHelp,
    setShowQuickActions,
    setShowShareModal,
    setShowOnboarding,
    setShareUrl,
    setConflictData,
    // Actions
    closeAllDialogs,
  }
}
