// Type augmentations for File System Access API
// Some methods are not yet in @types/wicg-file-system-access

declare global {
  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  }

  interface FileSystemHandlePermissionDescriptor {
    mode?: "read" | "readwrite"
  }
}

export {}
