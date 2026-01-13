import {
  Plugin,
  TFile,
  TAbstractFile,
  Notice,
  WorkspaceLeaf,
} from 'obsidian';
import { ImageMasterSettings, DEFAULT_SETTINGS, isImageFile } from './types';
import { ImageMasterSettingTab } from './settings';
import { FileManager } from './core/FileManager';
import { HashService } from './core/HashService';
import { LinkUpdater } from './core/LinkUpdater';
import { OrphanDetector } from './core/OrphanDetector';
import { GALLERY_VIEW_TYPE, GalleryView } from './ui/GalleryView';

export default class ImageMasterPlugin extends Plugin {
  settings: ImageMasterSettings;
  fileManager: FileManager;
  hashService: HashService;
  linkUpdater: LinkUpdater;
  orphanDetector: OrphanDetector;

  async onload() {
    console.log('Loading Star ImageMaster plugin');

    // Load settings
    await this.loadSettings();

    // Initialize core services
    this.hashService = new HashService(this);
    this.fileManager = new FileManager(this);
    this.linkUpdater = new LinkUpdater(this);
    this.orphanDetector = new OrphanDetector(this);

    // Register gallery view
    this.registerView(
      GALLERY_VIEW_TYPE,
      (leaf) => new GalleryView(leaf, this)
    );

    // Add ribbon icon for gallery
    this.addRibbonIcon('image', 'Open Image Gallery', () => {
      this.activateGalleryView();
    });

    // Add settings tab
    this.addSettingTab(new ImageMasterSettingTab(this.app, this));

    // Register commands
    this.addCommand({
      id: 'open-image-gallery',
      name: 'Open Image Gallery',
      callback: () => {
        this.activateGalleryView();
      },
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'g',
        },
      ],
    });

    this.addCommand({
      id: 'scan-orphan-images',
      name: 'Scan for Orphan Images',
      callback: async () => {
        const orphans = await this.orphanDetector.scanOrphanImages();
        new Notice(`Found ${orphans.length} orphan image(s)`);
      },
    });

    // Register event handlers
    this.registerEventHandlers();

    // Load hash cache on startup
    await this.hashService.loadCache();

    console.log('Star ImageMaster plugin loaded');
  }

  onunload() {
    console.log('Unloading Star ImageMaster plugin');

    // Save hash cache
    this.hashService.saveCache();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Register event handlers for file operations
   */
  private registerEventHandlers() {
    // Handle file creation (image paste/drag)
    this.registerEvent(
      this.app.vault.on('create', async (file: TAbstractFile) => {
        if (file instanceof TFile && isImageFile(file.path)) {
          await this.handleImageCreate(file);
        }
      })
    );

    // Handle file rename/move
    this.registerEvent(
      this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
        if (file instanceof TFile) {
          if (isImageFile(file.path)) {
            // Image was renamed/moved
            await this.handleImageRename(file, oldPath);
          } else if (file.extension === 'md') {
            // Note was renamed/moved
            await this.handleNoteRename(file, oldPath);
          }
        }
      })
    );

    // Handle file deletion
    this.registerEvent(
      this.app.vault.on('delete', async (file: TAbstractFile) => {
        if (file instanceof TFile) {
          if (isImageFile(file.path)) {
            await this.handleImageDelete(file);
          } else if (file.extension === 'md') {
            await this.handleNoteDelete(file);
          }
        }
      })
    );

    // Handle editor paste event for image handling
    this.registerEvent(
      this.app.workspace.on('editor-paste', async (evt: ClipboardEvent, editor, markdownView) => {
        const files = evt.clipboardData?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            evt.preventDefault();
            await this.handleImagePaste(file, markdownView.file);
          }
        }
      })
    );
  }

  /**
   * Handle new image creation
   */
  private async handleImageCreate(file: TFile) {
    // Calculate and cache hash
    if (this.settings.enableDuplicateDetection) {
      await this.hashService.calculateHash(file);
    }
  }

  /**
   * Handle image rename/move
   */
  private async handleImageRename(file: TFile, oldPath: string) {
    // Update all references to this image
    await this.linkUpdater.updateImageReferences(oldPath, file.path);

    // Update hash cache
    this.hashService.updateCachePath(oldPath, file.path);
  }

  /**
   * Handle image deletion
   */
  private async handleImageDelete(file: TFile) {
    // Remove from hash cache
    this.hashService.removeFromCache(file.path);
  }

  /**
   * Handle note rename/move
   */
  private async handleNoteRename(file: TFile, oldPath: string) {
    const oldFolder = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newFolder = file.path.substring(0, file.path.lastIndexOf('/'));

    // If folder changed and using folderBased or sameAsNote mode
    if (oldFolder !== newFolder) {
      if (this.settings.storageMode === 'folderBased' && this.settings.moveImagesWithNote) {
        await this.fileManager.handleNoteFolderChange(file, oldPath);
      } else if (this.settings.storageMode === 'sameAsNote' && this.settings.moveImagesWithNote) {
        await this.fileManager.moveImagesWithNote(file, oldPath);
      }
    }

    // If using noteFolder mode and note was renamed
    if (this.settings.storageMode === 'noteFolder' && this.settings.renameImageFolder) {
      const oldName = oldPath.split('/').pop()?.replace('.md', '') || '';
      const newName = file.basename;
      if (oldName !== newName) {
        await this.fileManager.renameImageFolder(oldName, newName);
      }
    }
  }

  /**
   * Handle note deletion
   */
  private async handleNoteDelete(file: TFile) {
    // Trigger orphan detection for images that were referenced by this note
    if (this.settings.autoDetectOrphans) {
      // Schedule orphan scan after a short delay to ensure cache is updated
      setTimeout(async () => {
        await this.orphanDetector.scanOrphanImages();
      }, 1000);
    }
  }

  /**
   * Handle image paste from clipboard
   */
  private async handleImagePaste(blob: File, activeFile: TFile | null) {
    if (!activeFile) {
      new Notice('No active note to paste image');
      return;
    }

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Check for duplicates
      if (this.settings.enableDuplicateDetection) {
        const existingImage = await this.hashService.findDuplicate(arrayBuffer);
        if (existingImage) {
          if (this.settings.duplicateAction === 'reuse') {
            // Insert link to existing image
            await this.fileManager.insertImageLink(activeFile, existingImage);
            new Notice('Reusing existing duplicate image');
            return;
          }
          // If action is 'ask' or 'rename', continue to create new file
        }
      }

      // Determine save path based on settings
      const savePath = await this.fileManager.determineSavePath(activeFile, blob.name || 'image.png');

      // Save the image
      const savedFile = await this.fileManager.saveImage(arrayBuffer, savePath);

      // Insert link to the new image
      await this.fileManager.insertImageLink(activeFile, savedFile.path);

      new Notice(`Image saved: ${savedFile.name}`);
    } catch (error) {
      console.error('Error handling image paste:', error);
      new Notice('Failed to save image');
    }
  }

  /**
   * Activate gallery view
   */
  async activateGalleryView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(GALLERY_VIEW_TYPE);

    if (leaves.length > 0) {
      // A gallery view already exists, use it
      leaf = leaves[0];
    } else {
      // Create new leaf in right sidebar
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: GALLERY_VIEW_TYPE, active: true });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
