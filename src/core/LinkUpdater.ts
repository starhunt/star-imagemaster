import { TFile } from 'obsidian';
import ImageMasterPlugin from '../main';

/**
 * LinkUpdater handles updating image references in notes:
 * - Update all notes when an image is renamed/moved
 * - Parse and update wikilinks and markdown links
 */
export class LinkUpdater {
  private plugin: ImageMasterPlugin;

  constructor(plugin: ImageMasterPlugin) {
    this.plugin = plugin;
  }

  /**
   * Update all references to an image when it's renamed/moved
   */
  async updateImageReferences(oldPath: string, newPath: string): Promise<number> {
    const notesToUpdate = this.findNotesReferencingImage(oldPath);
    let updatedCount = 0;

    for (const notePath of notesToUpdate) {
      const file = this.plugin.app.vault.getAbstractFileByPath(notePath);
      if (file && file instanceof TFile) {
        const updated = await this.updateLinksInNote(file, oldPath, newPath);
        if (updated) {
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} note(s) with new image path: ${newPath}`);
    }

    return updatedCount;
  }

  /**
   * Find all notes that reference an image
   */
  findNotesReferencingImage(imagePath: string): string[] {
    const notes: string[] = [];
    const imageName = imagePath.split('/').pop() || '';

    // Use resolvedLinks from metadata cache
    const resolvedLinks = this.plugin.app.metadataCache.resolvedLinks;

    for (const [notePath, links] of Object.entries(resolvedLinks)) {
      for (const linkedPath of Object.keys(links)) {
        if (linkedPath === imagePath) {
          notes.push(notePath);
          break;
        }
      }
    }

    return notes;
  }

  /**
   * Update image links in a single note
   */
  async updateLinksInNote(noteFile: TFile, oldPath: string, newPath: string): Promise<boolean> {
    let content = await this.plugin.app.vault.read(noteFile);
    const originalContent = content;

    const oldName = oldPath.split('/').pop() || '';
    const newName = newPath.split('/').pop() || '';

    // Update wikilinks: ![[path]] or ![[name]]
    // Pattern 1: Full path wikilink
    content = content.replace(
      new RegExp(`!\\[\\[${this.escapeRegex(oldPath)}(\\|[^\\]]*)?\\]\\]`, 'g'),
      `![[${newPath}$1]]`
    );

    // Pattern 2: Name-only wikilink (if name changed)
    if (oldName !== newName) {
      content = content.replace(
        new RegExp(`!\\[\\[${this.escapeRegex(oldName)}(\\|[^\\]]*)?\\]\\]`, 'g'),
        (match) => {
          // Only replace if it's actually referencing this image
          const resolvedPath = this.plugin.app.metadataCache.getFirstLinkpathDest(
            oldName,
            noteFile.path
          );
          if (resolvedPath?.path === oldPath) {
            return match.replace(oldName, newName);
          }
          return match;
        }
      );
    }

    // Update markdown links: ![alt](path)
    // Pattern 1: Absolute path
    content = content.replace(
      new RegExp(`!\\[([^\\]]*)\\]\\(/?${this.escapeRegex(oldPath)}\\)`, 'g'),
      `![$1](/${newPath})`
    );

    // Pattern 2: Relative path - need to recalculate
    const noteFolder = noteFile.path.substring(0, noteFile.path.lastIndexOf('/')) || '';
    const oldRelative = this.getRelativePath(noteFolder, oldPath);
    const newRelative = this.getRelativePath(noteFolder, newPath);

    content = content.replace(
      new RegExp(`!\\[([^\\]]*)\\]\\(${this.escapeRegex(oldRelative)}\\)`, 'g'),
      `![$1](${newRelative})`
    );

    // Only write if changed
    if (content !== originalContent) {
      await this.plugin.app.vault.modify(noteFile, content);
      return true;
    }

    return false;
  }

  /**
   * Get all notes that reference a specific image
   */
  getReferencingNotes(imagePath: string): TFile[] {
    const notePaths = this.findNotesReferencingImage(imagePath);
    const notes: TFile[] = [];

    for (const path of notePaths) {
      const file = this.plugin.app.vault.getAbstractFileByPath(path);
      if (file && file instanceof TFile) {
        notes.push(file);
      }
    }

    return notes;
  }

  /**
   * Check if an image is referenced by any note
   */
  isImageReferenced(imagePath: string): boolean {
    return this.findNotesReferencingImage(imagePath).length > 0;
  }

  /**
   * Get count of references to an image
   */
  getReferenceCount(imagePath: string): number {
    return this.findNotesReferencingImage(imagePath).length;
  }

  /**
   * Batch update multiple image references
   */
  async batchUpdateReferences(
    updates: Array<{ oldPath: string; newPath: string }>
  ): Promise<number> {
    let totalUpdated = 0;

    for (const { oldPath, newPath } of updates) {
      const count = await this.updateImageReferences(oldPath, newPath);
      totalUpdated += count;
    }

    return totalUpdated;
  }

  /**
   * Get relative path from one location to another
   */
  private getRelativePath(fromFolder: string, toPath: string): string {
    const fromParts = fromFolder.split('/').filter((p) => p);
    const toParts = toPath.split('/').filter((p) => p);

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
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Parse all image links from a note's content
   */
  parseImageLinks(content: string): Array<{ link: string; isWikilink: boolean; fullMatch: string }> {
    const links: Array<{ link: string; isWikilink: boolean; fullMatch: string }> = [];

    // Wikilinks: ![[path]] or ![[path|alias]]
    const wikilinkRegex = /!\[\[([^\]|]+)(\|[^\]]*)?]]/g;
    let match;
    while ((match = wikilinkRegex.exec(content)) !== null) {
      links.push({
        link: match[1],
        isWikilink: true,
        fullMatch: match[0],
      });
    }

    // Markdown links: ![alt](path)
    const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = markdownRegex.exec(content)) !== null) {
      links.push({
        link: match[2],
        isWikilink: false,
        fullMatch: match[0],
      });
    }

    return links;
  }

  /**
   * Validate all image links in a note
   */
  async validateImageLinks(noteFile: TFile): Promise<Array<{ link: string; exists: boolean }>> {
    const content = await this.plugin.app.vault.read(noteFile);
    const links = this.parseImageLinks(content);
    const results: Array<{ link: string; exists: boolean }> = [];

    for (const { link } of links) {
      const resolvedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
        link,
        noteFile.path
      );
      results.push({
        link,
        exists: resolvedFile !== null,
      });
    }

    return results;
  }
}
