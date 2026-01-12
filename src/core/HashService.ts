import { TFile, normalizePath } from 'obsidian';
import { createHash } from 'crypto';
import ImageMasterPlugin from '../main';
import { HashCache, isImageFile } from '../types';

/**
 * HashService handles image hash calculation and caching:
 * - Calculate SHA-256 hash for duplicate detection
 * - Cache hashes to avoid recalculation
 * - Find duplicate images by hash
 */
export class HashService {
  private plugin: ImageMasterPlugin;
  private cache: HashCache = {};
  private readonly CACHE_FILE = '.image-master/hash-cache.json';

  constructor(plugin: ImageMasterPlugin) {
    this.plugin = plugin;
  }

  /**
   * Load hash cache from disk
   */
  async loadCache(): Promise<void> {
    try {
      const cachePath = normalizePath(this.CACHE_FILE);
      if (await this.plugin.app.vault.adapter.exists(cachePath)) {
        const content = await this.plugin.app.vault.adapter.read(cachePath);
        this.cache = JSON.parse(content);
        console.log(`Loaded hash cache with ${Object.keys(this.cache).length} entries`);
      }
    } catch (error) {
      console.error('Failed to load hash cache:', error);
      this.cache = {};
    }
  }

  /**
   * Save hash cache to disk
   */
  async saveCache(): Promise<void> {
    try {
      const cachePath = normalizePath(this.CACHE_FILE);
      const cacheFolder = cachePath.substring(0, cachePath.lastIndexOf('/'));

      // Ensure folder exists
      if (!(await this.plugin.app.vault.adapter.exists(cacheFolder))) {
        await this.plugin.app.vault.createFolder(cacheFolder);
      }

      await this.plugin.app.vault.adapter.write(cachePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('Failed to save hash cache:', error);
    }
  }

  /**
   * Calculate hash for an image file
   */
  async calculateHash(file: TFile): Promise<string> {
    // Check if cached and still valid
    const cached = this.cache[file.path];
    if (cached && cached.mtime === file.stat.mtime) {
      return cached.hash;
    }

    // Calculate new hash
    const data = await this.plugin.app.vault.readBinary(file);
    const hash = this.computeHash(data);

    // Update cache
    this.cache[file.path] = {
      hash,
      mtime: file.stat.mtime,
    };

    return hash;
  }

  /**
   * Calculate hash from ArrayBuffer
   */
  async calculateHashFromBuffer(data: ArrayBuffer): Promise<string> {
    return this.computeHash(data);
  }

  /**
   * Compute SHA-256 hash
   */
  private computeHash(data: ArrayBuffer): string {
    const hashInstance = createHash('sha256');
    hashInstance.update(Buffer.from(data));
    return hashInstance.digest('hex').substring(0, 16); // First 16 chars
  }

  /**
   * Find duplicate image by comparing hash
   */
  async findDuplicate(data: ArrayBuffer): Promise<string | null> {
    const newHash = await this.calculateHashFromBuffer(data);

    // Search in cache
    for (const [path, entry] of Object.entries(this.cache)) {
      if (entry.hash === newHash) {
        // Verify file still exists
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (file && file instanceof TFile) {
          return path;
        } else {
          // Remove stale cache entry
          delete this.cache[path];
        }
      }
    }

    // Search in vault (for uncached images)
    const images = this.plugin.app.vault.getFiles().filter((f) => isImageFile(f.path));

    for (const image of images) {
      if (!this.cache[image.path]) {
        const hash = await this.calculateHash(image);
        if (hash === newHash) {
          return image.path;
        }
      }
    }

    return null;
  }

  /**
   * Update cache path when file is renamed/moved
   */
  updateCachePath(oldPath: string, newPath: string): void {
    if (this.cache[oldPath]) {
      this.cache[newPath] = this.cache[oldPath];
      delete this.cache[oldPath];
    }
  }

  /**
   * Remove file from cache
   */
  removeFromCache(path: string): void {
    delete this.cache[path];
  }

  /**
   * Get hash for a path (from cache or calculate)
   */
  async getHash(path: string): Promise<string | null> {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (file && file instanceof TFile && isImageFile(file.path)) {
      return await this.calculateHash(file);
    }
    return null;
  }

  /**
   * Rebuild entire hash cache
   */
  async rebuildCache(): Promise<void> {
    this.cache = {};
    const images = this.plugin.app.vault.getFiles().filter((f) => isImageFile(f.path));

    for (const image of images) {
      await this.calculateHash(image);
    }

    await this.saveCache();
    console.log(`Rebuilt hash cache with ${Object.keys(this.cache).length} entries`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; size: number } {
    const total = Object.keys(this.cache).length;
    const size = JSON.stringify(this.cache).length;
    return { total, size };
  }

  /**
   * Find all duplicates in vault
   */
  async findAllDuplicates(): Promise<Map<string, string[]>> {
    const hashToFiles = new Map<string, string[]>();

    const images = this.plugin.app.vault.getFiles().filter((f) => isImageFile(f.path));

    for (const image of images) {
      const hash = await this.calculateHash(image);
      const existing = hashToFiles.get(hash) || [];
      existing.push(image.path);
      hashToFiles.set(hash, existing);
    }

    // Filter to only duplicates (more than one file with same hash)
    const duplicates = new Map<string, string[]>();
    for (const [hash, files] of hashToFiles) {
      if (files.length > 1) {
        duplicates.set(hash, files);
      }
    }

    return duplicates;
  }
}
