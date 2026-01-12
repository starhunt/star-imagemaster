import { TFile, TFolder, normalizePath, Notice } from 'obsidian';
import ImageMasterPlugin from '../main';
import { ImageInfo, isImageFile } from '../types';

/**
 * OrphanDetector handles detection and management of orphan images:
 * - Scan vault for unreferenced images
 * - Track orphan status
 * - Move orphans to designated folder
 */
export class OrphanDetector {
  private plugin: ImageMasterPlugin;
  private orphanImages: Set<string> = new Set();

  constructor(plugin: ImageMasterPlugin) {
    this.plugin = plugin;
  }

  /**
   * Scan vault for orphan images (not referenced by any note)
   */
  async scanOrphanImages(): Promise<string[]> {
    const allImages = this.plugin.app.vault.getFiles().filter((f) => isImageFile(f.path));
    const referencedImages = this.getAllReferencedImages();

    const orphans: string[] = [];
    this.orphanImages.clear();

    for (const image of allImages) {
      if (!referencedImages.has(image.path)) {
        orphans.push(image.path);
        this.orphanImages.add(image.path);
      }
    }

    console.log(`Found ${orphans.length} orphan images out of ${allImages.length} total`);

    // Handle orphans based on settings
    if (this.plugin.settings.orphanHandling === 'moveToFolder' && orphans.length > 0) {
      await this.moveOrphansToFolder(orphans);
    }

    return orphans;
  }

  /**
   * Get all images referenced by any note in the vault
   */
  getAllReferencedImages(): Set<string> {
    const referenced = new Set<string>();
    const resolvedLinks = this.plugin.app.metadataCache.resolvedLinks;

    for (const links of Object.values(resolvedLinks)) {
      for (const linkedPath of Object.keys(links)) {
        if (isImageFile(linkedPath)) {
          referenced.add(linkedPath);
        }
      }
    }

    return referenced;
  }

  /**
   * Check if a specific image is orphan
   */
  isOrphan(imagePath: string): boolean {
    // Check cache first
    if (this.orphanImages.has(imagePath)) {
      return true;
    }

    // Check in resolved links
    const resolvedLinks = this.plugin.app.metadataCache.resolvedLinks;

    for (const links of Object.values(resolvedLinks)) {
      if (imagePath in links) {
        return false;
      }
    }

    // Not found in any note, it's an orphan
    this.orphanImages.add(imagePath);
    return true;
  }

  /**
   * Get list of orphan images
   */
  getOrphanImages(): string[] {
    return Array.from(this.orphanImages);
  }

  /**
   * Get count of orphan images
   */
  getOrphanCount(): number {
    return this.orphanImages.size;
  }

  /**
   * Move orphan images to designated folder
   */
  async moveOrphansToFolder(orphanPaths: string[]): Promise<void> {
    const targetFolder = this.plugin.settings.orphanFolder;
    await this.ensureFolderExists(targetFolder);

    let movedCount = 0;

    for (const imagePath of orphanPaths) {
      const file = this.plugin.app.vault.getAbstractFileByPath(imagePath);
      if (file && file instanceof TFile) {
        const fileName = file.name;
        const newPath = normalizePath(`${targetFolder}/${fileName}`);

        // Handle name conflicts
        let finalPath = newPath;
        let counter = 1;
        while (await this.plugin.app.vault.adapter.exists(finalPath)) {
          const ext = fileName.split('.').pop() || '';
          const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
          finalPath = normalizePath(`${targetFolder}/${nameWithoutExt}_${counter}.${ext}`);
          counter++;
        }

        try {
          await this.plugin.app.vault.rename(file, finalPath);
          movedCount++;
        } catch (error) {
          console.error(`Failed to move orphan image ${imagePath}:`, error);
        }
      }
    }

    if (movedCount > 0) {
      new Notice(`Moved ${movedCount} orphan image(s) to ${targetFolder}`);
    }
  }

  /**
   * Delete orphan images
   */
  async deleteOrphanImages(imagePaths: string[]): Promise<number> {
    let deletedCount = 0;

    for (const imagePath of imagePaths) {
      const file = this.plugin.app.vault.getAbstractFileByPath(imagePath);
      if (file && file instanceof TFile) {
        try {
          await this.plugin.app.vault.delete(file);
          this.orphanImages.delete(imagePath);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete orphan image ${imagePath}:`, error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get detailed info about orphan images
   */
  async getOrphanImageInfos(): Promise<ImageInfo[]> {
    const infos: ImageInfo[] = [];

    for (const imagePath of this.orphanImages) {
      const file = this.plugin.app.vault.getAbstractFileByPath(imagePath);
      if (file && file instanceof TFile) {
        const info: ImageInfo = {
          path: file.path,
          name: file.name,
          extension: file.extension,
          size: file.stat.size,
          created: file.stat.ctime,
          modified: file.stat.mtime,
          referencedBy: [],
          isOrphan: true,
        };
        infos.push(info);
      }
    }

    return infos;
  }

  /**
   * Mark an image as no longer orphan
   */
  markAsReferenced(imagePath: string): void {
    this.orphanImages.delete(imagePath);
  }

  /**
   * Clear orphan cache
   */
  clearCache(): void {
    this.orphanImages.clear();
  }

  /**
   * Ensure folder exists
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    if (!folderPath) return;

    const normalizedPath = normalizePath(folderPath);
    const folder = this.plugin.app.vault.getAbstractFileByPath(normalizedPath);

    if (!folder) {
      await this.plugin.app.vault.createFolder(normalizedPath);
    }
  }

  /**
   * Get all images with their reference info
   */
  async getAllImageInfos(): Promise<ImageInfo[]> {
    const allImages = this.plugin.app.vault.getFiles().filter((f) => isImageFile(f.path));
    const infos: ImageInfo[] = [];

    for (const image of allImages) {
      const referencingNotes = this.plugin.linkUpdater.findNotesReferencingImage(image.path);
      const isOrphan = referencingNotes.length === 0;

      if (isOrphan) {
        this.orphanImages.add(image.path);
      }

      const info: ImageInfo = {
        path: image.path,
        name: image.name,
        extension: image.extension,
        size: image.stat.size,
        created: image.stat.ctime,
        modified: image.stat.mtime,
        referencedBy: referencingNotes,
        isOrphan,
      };

      // Try to get image dimensions (would need additional processing)
      // For now, leave width/height undefined

      infos.push(info);
    }

    return infos;
  }

  /**
   * Get statistics about images
   */
  async getImageStats(): Promise<{
    total: number;
    orphan: number;
    inUse: number;
    totalSize: number;
    orphanSize: number;
  }> {
    await this.scanOrphanImages();

    const allImages = this.plugin.app.vault.getFiles().filter((f) => isImageFile(f.path));
    let totalSize = 0;
    let orphanSize = 0;

    for (const image of allImages) {
      totalSize += image.stat.size;
      if (this.orphanImages.has(image.path)) {
        orphanSize += image.stat.size;
      }
    }

    return {
      total: allImages.length,
      orphan: this.orphanImages.size,
      inUse: allImages.length - this.orphanImages.size,
      totalSize,
      orphanSize,
    };
  }
}
