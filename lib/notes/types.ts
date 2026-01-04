// Data Transfer Objects (DTOs) - keep as interfaces

export interface ShareData {
  id: string
  n?: string // optional name
  c: string // content
  v: "1" // version
}

export interface FileFormat {
  version: "1.0"
  id: string
  name: string
  content: string
}
