import { TFile, TFolder, normalizePath, Notice, MarkdownView } from 'obsidian';
import ImageMasterPlugin from '../main';
import { PatternVariables, isImageFile } from '../types';

/**
 * FileManager handles image file operations:
 * - Determining save paths based on storage mode
 * - Saving images with proper naming
 * - Moving images when notes are moved
 * - Inserting image links into notes
 */
export class FileManager {
  private plugin: ImageMasterPlugin;

  constructor(plugin: ImageMasterPlugin) {
    this.plugin = plugin;
  }

  /**
   * Determine the save path for a new image based on settings
   */
  async determineSavePath(activeFile: TFile, originalFilename: string): Promise<string> {
    const settings = this.plugin.settings;
    const noteFolder = activeFile.path.substring(0, activeFile.path.lastIndexOf('/')) || '';
    const noteName = activeFile.basename;

    let basePath: string;

    switch (settings.storageMode) {
      case 'folderBased': {
        // {noteFolder}/{folderName}_img/
        const folderName = noteFolder.split('/').pop() || '';
        const suffix = settings.imageFolderSuffix || '_img';
        basePath = noteFolder
          ? `${noteFolder}/${folderName}${suffix}`
          : suffix.startsWith('_') ? suffix : `_${suffix}`;
        break;
      }
      case 'central': {
        basePath = settings.centralFolder;
        break;
      }
      case 'dateBased': {
        const dateFolder = this.formatDatePath(settings.dateFormat);
        basePath = `${settings.centralFolder}/${dateFolder}`;
        break;
      }
      case 'noteFolder': {
        basePath = `${settings.centralFolder}/${noteName}`;
        break;
      }
      case 'sameAsNote': {
        basePath = noteFolder || '';
        break;
      }
      default:
        basePath = settings.centralFolder;
    }

    // Ensure folder exists
    await this.ensureFolderExists(basePath);

    // Generate filename
    const filename = await this.generateFilename(originalFilename, activeFile);

    // Handle conflicts
    const finalPath = await this.resolveConflict(basePath, filename);

    return finalPath;
  }

  /**
   * Format date path using pattern variables
   */
  private formatDatePath(pattern: string): string {
    const now = new Date();
    return pattern
      .replace('{year}', now.getFullYear().toString())
      .replace('{month}', String(now.getMonth() + 1).padStart(2, '0'))
      .replace('{day}', String(now.getDate()).padStart(2, '0'));
  }

  /**
   * Generate filename based on settings
   */
  private async generateFilename(originalFilename: string, activeFile: TFile): Promise<string> {
    const settings = this.plugin.settings;
    const ext = originalFilename.split('.').pop() || 'png';
    const originalName = originalFilename.replace(/\.[^.]+$/, '');

    const variables = this.getPatternVariables(originalName, ext, activeFile);

    let filename: string;

    switch (settings.filenamePattern) {
      case 'original':
        filename = originalFilename;
        break;
      case 'timestamp':
        filename = `${variables.timestamp}_${originalName}.${ext}`;
        break;
      case 'uuid':
        filename = `${variables.uuid}.${ext}`;
        break;
      case 'hash':
        // Hash will be calculated later, use timestamp for now
        filename = `${variables.timestamp}.${ext}`;
        break;
      case 'custom':
        filename = this.applyCustomPattern(settings.customPattern, variables) + `.${ext}`;
        break;
      default:
        filename = originalFilename;
    }

    return filename;
  }

  /**
   * Get pattern variables for filename generation
   */
  private getPatternVariables(originalName: string, ext: string, activeFile: TFile): PatternVariables {
    const now = new Date();
    const noteFolder = activeFile.path.substring(0, activeFile.path.lastIndexOf('/')) || '';

    return {
      original: originalName,
      ext: ext,
      timestamp: this.formatTimestamp(now),
      date: this.formatDate(now),
      year: now.getFullYear().toString(),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
      uuid: this.generateUUID(),
      hash: '', // Will be filled later if needed
      note: activeFile.basename,
      folder: noteFolder.split('/').pop() || '',
      counter: 0,
    };
  }

  /**
   * Format timestamp as YYYYMMdd_HHmmss
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}${second}`;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate 8-character UUID
   */
  private generateUUID(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Apply custom pattern with variables
   */
  private applyCustomPattern(pattern: string, variables: PatternVariables): string {
    let result = pattern;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Resolve filename conflicts by adding counter
   */
  private async resolveConflict(basePath: string, filename: string): Promise<string> {
    let finalPath = normalizePath(`${basePath}/${filename}`);
    let counter = 1;

    const ext = filename.split('.').pop() || '';
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    while (await this.plugin.app.vault.adapter.exists(finalPath)) {
      finalPath = normalizePath(`${basePath}/${nameWithoutExt}_${counter}.${ext}`);
      counter++;
    }

    return finalPath;
  }

  /**
   * Ensure folder exists, create if not
   */
  async ensureFolderExists(folderPath: string): Promise<void> {
    if (!folderPath) return;

    const normalizedPath = normalizePath(folderPath);
    const folder = this.plugin.app.vault.getAbstractFileByPath(normalizedPath);

    if (!folder) {
      await this.plugin.app.vault.createFolder(normalizedPath);
    }
  }

  /**
   * Save image to vault
   */
  async saveImage(data: ArrayBuffer, path: string): Promise<TFile> {
    const normalizedPath = normalizePath(path);

    // Ensure parent folder exists
    const folderPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
    await this.ensureFolderExists(folderPath);

    // Create the file
    const file = await this.plugin.app.vault.createBinary(normalizedPath, data);
    return file;
  }

  /**
   * Insert image link into active note
   */
  async insertImageLink(noteFile: TFile, imagePath: string): Promise<void> {
    const link = this.formatImageLink(imagePath, noteFile);

    // Get the active editor
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView && activeView.file?.path === noteFile.path) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(link + '\n', cursor);
      editor.setCursor({ line: cursor.line + 1, ch: 0 });
    } else {
      // Append to file if not active
      const content = await this.plugin.app.vault.read(noteFile);
      await this.plugin.app.vault.modify(noteFile, content + '\n' + link);
    }
  }

  /**
   * Format image link based on settings
   */
  formatImageLink(imagePath: string, noteFile: TFile): string {
    const settings = this.plugin.settings;
    const imageName = imagePath.split('/').pop() || imagePath;

    switch (settings.linkFormat) {
      case 'wikilink':
        return `![[${imageName}]]`;

      case 'wikilink-path':
        return `![[${imagePath}]]`;

      case 'markdown-relative': {
        const noteFolder = noteFile.path.substring(0, noteFile.path.lastIndexOf('/')) || '';
        const relativePath = this.getRelativePath(noteFolder, imagePath);
        return `![](${relativePath})`;
      }

      case 'markdown-absolute':
        return `![](/${imagePath})`;

      default:
        return `![[${imagePath}]]`;
    }
  }

  /**
   * Get relative path from one location to another
   */
  private getRelativePath(fromFolder: string, toPath: string): string {
    const fromParts = fromFolder.split('/').filter(p => p);
    const toParts = toPath.split('/').filter(p => p);

    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    const upCount = fromParts.length - commonLength;
    const downPath = toParts.slice(commonLength).join('/');

    if (upCount === 0) {
      return './' + downPath;
    }

    return '../'.repeat(upCount) + downPath;
  }

  /**
   * Handle note folder change (folderBased mode)
   */
  async handleNoteFolderChange(noteFile: TFile, oldPath: string): Promise<void> {
    const oldFolder = oldPath.substring(0, oldPath.lastIndexOf('/')) || '';
    const newFolder = noteFile.path.substring(0, noteFile.path.lastIndexOf('/')) || '';

    if (oldFolder === newFolder) return;

    const settings = this.plugin.settings;
    const suffix = settings.imageFolderSuffix || '_img';

    // Get old and new image folder paths
    const oldFolderName = oldFolder.split('/').pop() || '';
    const newFolderName = newFolder.split('/').pop() || '';

    const oldImageFolder = oldFolder
      ? `${oldFolder}/${oldFolderName}${suffix}`
      : suffix.startsWith('_') ? suffix : `_${suffix}`;
    const newImageFolder = newFolder
      ? `${newFolder}/${newFolderName}${suffix}`
      : suffix.startsWith('_') ? suffix : `_${suffix}`;

    // Get images referenced by this note
    const referencedImages = await this.getReferencedImages(noteFile);

    // Move each referenced image
    for (const imagePath of referencedImages) {
      if (imagePath.startsWith(oldImageFolder)) {
        const imageName = imagePath.split('/').pop() || '';
        const newImagePath = `${newImageFolder}/${imageName}`;

        await this.moveImage(imagePath, newImagePath);
      }
    }

    // Cleanup empty folder
    if (settings.cleanupEmptyFolders) {
      await this.cleanupEmptyFolder(oldImageFolder);
    }
  }

  /**
   * Move images with note (sameAsNote mode)
   */
  async moveImagesWithNote(noteFile: TFile, oldPath: string): Promise<void> {
    const oldFolder = oldPath.substring(0, oldPath.lastIndexOf('/')) || '';
    const newFolder = noteFile.path.substring(0, noteFile.path.lastIndexOf('/')) || '';

    if (oldFolder === newFolder) return;

    const referencedImages = await this.getReferencedImages(noteFile);

    for (const imagePath of referencedImages) {
      if (imagePath.startsWith(oldFolder)) {
        const imageName = imagePath.split('/').pop() || '';
        const newImagePath = newFolder ? `${newFolder}/${imageName}` : imageName;

        await this.moveImage(imagePath, newImagePath);
      }
    }

    if (this.plugin.settings.cleanupEmptyFolders) {
      await this.cleanupEmptyFolder(oldFolder);
    }
  }

  /**
   * Rename image folder (noteFolder mode)
   */
  async renameImageFolder(oldNoteName: string, newNoteName: string): Promise<void> {
    const settings = this.plugin.settings;
    const oldFolderPath = `${settings.centralFolder}/${oldNoteName}`;
    const newFolderPath = `${settings.centralFolder}/${newNoteName}`;

    const folder = this.plugin.app.vault.getAbstractFileByPath(oldFolderPath);
    if (folder && folder instanceof TFolder) {
      await this.plugin.app.vault.rename(folder, newFolderPath);
    }
  }

  /**
   * Get images referenced by a note
   */
  async getReferencedImages(noteFile: TFile): Promise<string[]> {
    const cache = this.plugin.app.metadataCache.getFileCache(noteFile);
    const images: string[] = [];

    if (cache?.embeds) {
      for (const embed of cache.embeds) {
        const linkPath = embed.link;
        const resolvedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
          linkPath,
          noteFile.path
        );

        if (resolvedFile && isImageFile(resolvedFile.path)) {
          images.push(resolvedFile.path);
        }
      }
    }

    return images;
  }

  /**
   * Move image to new location
   */
  async moveImage(oldPath: string, newPath: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(oldPath);
    if (file && file instanceof TFile) {
      const normalizedNewPath = normalizePath(newPath);

      // Ensure target folder exists
      const targetFolder = normalizedNewPath.substring(0, normalizedNewPath.lastIndexOf('/'));
      await this.ensureFolderExists(targetFolder);

      await this.plugin.app.vault.rename(file, normalizedNewPath);
    }
  }

  /**
   * Cleanup empty folder
   */
  async cleanupEmptyFolder(folderPath: string): Promise<void> {
    const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
    if (folder && folder instanceof TFolder) {
      if (folder.children.length === 0) {
        await this.plugin.app.vault.delete(folder);
      }
    }
  }

  /**
   * Get all images in vault
   */
  getAllImages(): TFile[] {
    return this.plugin.app.vault.getFiles().filter((file) => isImageFile(file.path));
  }
}
