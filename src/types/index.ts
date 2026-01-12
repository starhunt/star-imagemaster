/**
 * Image Master Plugin - Type Definitions
 */

// ============================================
// Storage Mode Types
// ============================================

export type StorageMode =
  | 'folderBased'    // {folderName}_img subfolder (default)
  | 'central'        // Single attachments folder
  | 'dateBased'      // attachments/{year}/{month}
  | 'noteFolder'     // attachments/{noteName}
  | 'sameAsNote';    // Same folder as note

export type FilenamePattern =
  | 'original'       // Keep original filename
  | 'timestamp'      // YYYYMMdd_HHmmss_original
  | 'uuid'           // Random UUID
  | 'hash'           // Content hash (first 8 chars)
  | 'custom';        // User-defined pattern

export type LinkFormat =
  | 'wikilink'           // ![[image.png]]
  | 'wikilink-path'      // ![[folder/image.png]]
  | 'markdown-relative'  // ![](./folder/image.png)
  | 'markdown-absolute'; // ![](/folder/image.png)

export type OrphanHandling =
  | 'keep'           // Keep in place
  | 'moveToFolder'   // Move to orphan folder
  | 'markOnly';      // Only mark as orphan

export type DuplicateAction =
  | 'reuse'          // Reuse existing image
  | 'ask'            // Ask user
  | 'rename';        // Create with new name

// ============================================
// Settings Interface
// ============================================

export interface ImageMasterSettings {
  // Storage Location
  storageMode: StorageMode;
  imageFolderSuffix: string;      // Default: "_img"
  centralFolder: string;           // Default: "attachments"
  dateFormat: string;              // Default: "{year}/{month}"

  // Filename
  filenamePattern: FilenamePattern;
  customPattern: string;           // e.g., "{timestamp}_{original}"

  // Note Integration
  moveImagesWithNote: boolean;     // Move images when note moves
  renameImageFolder: boolean;      // Rename folder when note renamed (noteFolder mode)
  cleanupEmptyFolders: boolean;    // Auto-delete empty image folders

  // Link Format
  linkFormat: LinkFormat;

  // Duplicate Detection
  enableDuplicateDetection: boolean;
  duplicateAction: DuplicateAction;

  // Orphan Images
  orphanHandling: OrphanHandling;
  orphanFolder: string;            // Default: "_orphaned"
  autoDetectOrphans: boolean;

  // UI Settings
  galleryColumns: number;          // 3-6
  thumbnailSize: 'small' | 'medium' | 'large';
  showFileInfo: boolean;
}

export const DEFAULT_SETTINGS: ImageMasterSettings = {
  // Storage Location
  storageMode: 'folderBased',
  imageFolderSuffix: '_img',
  centralFolder: 'attachments',
  dateFormat: '{year}/{month}',

  // Filename
  filenamePattern: 'timestamp',
  customPattern: '{timestamp}_{original}',

  // Note Integration
  moveImagesWithNote: true,
  renameImageFolder: true,
  cleanupEmptyFolders: true,

  // Link Format
  linkFormat: 'wikilink-path',

  // Duplicate Detection
  enableDuplicateDetection: true,
  duplicateAction: 'reuse',

  // Orphan Images
  orphanHandling: 'markOnly',
  orphanFolder: '_orphaned',
  autoDetectOrphans: true,

  // UI Settings
  galleryColumns: 4,
  thumbnailSize: 'medium',
  showFileInfo: true,
};

// ============================================
// Image Information
// ============================================

export interface ImageInfo {
  path: string;                    // Full path from vault root
  name: string;                    // Filename with extension
  extension: string;               // File extension (png, jpg, etc.)
  size: number;                    // File size in bytes
  created: number;                 // Creation timestamp
  modified: number;                // Last modified timestamp
  hash?: string;                   // SHA-256 hash (first 16 chars)
  width?: number;                  // Image width in pixels
  height?: number;                 // Image height in pixels
  referencedBy: string[];          // List of note paths that reference this image
  isOrphan: boolean;               // True if no notes reference this image
}

// ============================================
// Hash Cache
// ============================================

export interface HashCache {
  [path: string]: {
    hash: string;
    mtime: number;                 // Last modified time when hash was calculated
  };
}

// ============================================
// Gallery View Types
// ============================================

export type GalleryFilter = 'all' | 'inUse' | 'orphan';

export interface GalleryState {
  filter: GalleryFilter;
  searchQuery: string;
  selectedImage: ImageInfo | null;
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
}

// ============================================
// Event Types
// ============================================

export interface ImageEvent {
  type: 'create' | 'delete' | 'rename' | 'modify';
  path: string;
  oldPath?: string;                // For rename events
}

export interface NoteEvent {
  type: 'create' | 'delete' | 'rename' | 'modify';
  path: string;
  oldPath?: string;                // For rename events
}

// ============================================
// Supported Image Formats
// ============================================

export const SUPPORTED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
] as const;

export type SupportedImageExtension = typeof SUPPORTED_IMAGE_EXTENSIONS[number];

export function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? SUPPORTED_IMAGE_EXTENSIONS.includes(ext as SupportedImageExtension) : false;
}

// ============================================
// Pattern Variables
// ============================================

export interface PatternVariables {
  original: string;     // Original filename without extension
  ext: string;          // File extension
  timestamp: string;    // YYYYMMdd_HHmmss
  date: string;         // YYYY-MM-DD
  year: string;         // YYYY
  month: string;        // MM
  day: string;          // DD
  uuid: string;         // 8-char UUID
  hash: string;         // 8-char SHA-256
  note: string;         // Current note name
  folder: string;       // Current note folder name
  counter: number;      // Auto-increment counter
}
