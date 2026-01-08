import { useCallback } from "react"

export interface FolderSyncParams {
  openFolder: () => Promise<void>
  closeFolder: () => Promise<void>
  showToast: (message: string) => void
}

/**
 * Folder synchronization logic with error handling
 */
export function useFolderSync({ openFolder, closeFolder, showToast }: FolderSyncParams) {
  const handleOpenFolder = useCallback(async () => {
    try {
      await openFolder()
      showToast("Folder opened successfully")
    } catch (error) {
      console.error("Error opening folder:", error)
      showToast("Failed to open folder")
    }
  }, [openFolder, showToast])

  const handleCloseFolder = useCallback(async () => {
    try {
      await closeFolder()
      showToast("Folder closed")
    } catch (error) {
      console.error("Error closing folder:", error)
    }
  }, [closeFolder, showToast])

  return {
    handleOpenFolder,
    handleCloseFolder,
  }
}
