import { App, PluginSettingTab, Setting } from 'obsidian';
import ImageMasterPlugin from './main';
import {
  StorageMode,
  FilenamePattern,
  LinkFormat,
  OrphanHandling,
  DuplicateAction,
} from './types';

export class ImageMasterSettingTab extends PluginSettingTab {
  plugin: ImageMasterPlugin;

  constructor(app: App, plugin: ImageMasterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ========================================
    // Storage Location Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Storage Location' });

    new Setting(containerEl)
      .setName('Storage mode')
      .setDesc('Choose how images are organized in your vault')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('folderBased', 'Folder-based ({folderName}_img)')
          .addOption('central', 'Central folder (attachments/)')
          .addOption('dateBased', 'Date-based (attachments/year/month/)')
          .addOption('noteFolder', 'Note folder (attachments/{noteName}/)')
          .addOption('sameAsNote', 'Same as note')
          .setValue(this.plugin.settings.storageMode)
          .onChange(async (value) => {
            this.plugin.settings.storageMode = value as StorageMode;
            await this.plugin.saveSettings();
            this.display(); // Refresh to show/hide related options
          })
      );

    // Folder-based mode options
    if (this.plugin.settings.storageMode === 'folderBased') {
      new Setting(containerEl)
        .setName('Image folder suffix')
        .setDesc('Suffix for image folders (e.g., "_img" creates "project_img")')
        .addText((text) =>
          text
            .setPlaceholder('_img')
            .setValue(this.plugin.settings.imageFolderSuffix)
            .onChange(async (value) => {
              this.plugin.settings.imageFolderSuffix = value || '_img';
              await this.plugin.saveSettings();
            })
        );
    }

    // Central/Date-based mode options
    if (['central', 'dateBased'].includes(this.plugin.settings.storageMode)) {
      new Setting(containerEl)
        .setName('Central folder')
        .setDesc('Folder name for storing images')
        .addText((text) =>
          text
            .setPlaceholder('attachments')
            .setValue(this.plugin.settings.centralFolder)
            .onChange(async (value) => {
              this.plugin.settings.centralFolder = value || 'attachments';
              await this.plugin.saveSettings();
            })
        );
    }

    // Date-based mode options
    if (this.plugin.settings.storageMode === 'dateBased') {
      new Setting(containerEl)
        .setName('Date format')
        .setDesc('Subfolder format using {year}, {month}, {day}')
        .addText((text) =>
          text
            .setPlaceholder('{year}/{month}')
            .setValue(this.plugin.settings.dateFormat)
            .onChange(async (value) => {
              this.plugin.settings.dateFormat = value || '{year}/{month}';
              await this.plugin.saveSettings();
            })
        );
    }

    // ========================================
    // Filename Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Filename' });

    new Setting(containerEl)
      .setName('Filename pattern')
      .setDesc('How to name saved images')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('original', 'Original filename')
          .addOption('timestamp', 'Timestamp + original')
          .addOption('uuid', 'Random UUID')
          .addOption('hash', 'Content hash')
          .addOption('custom', 'Custom pattern')
          .setValue(this.plugin.settings.filenamePattern)
          .onChange(async (value) => {
            this.plugin.settings.filenamePattern = value as FilenamePattern;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.filenamePattern === 'custom') {
      new Setting(containerEl)
        .setName('Custom pattern')
        .setDesc('Variables: {original}, {timestamp}, {date}, {year}, {month}, {day}, {uuid}, {hash}, {note}, {folder}')
        .addText((text) =>
          text
            .setPlaceholder('{timestamp}_{original}')
            .setValue(this.plugin.settings.customPattern)
            .onChange(async (value) => {
              this.plugin.settings.customPattern = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // ========================================
    // Note Integration Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Note Integration' });

    if (['folderBased', 'sameAsNote'].includes(this.plugin.settings.storageMode)) {
      new Setting(containerEl)
        .setName('Move images with note')
        .setDesc('When a note is moved, also move its referenced images')
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.moveImagesWithNote)
            .onChange(async (value) => {
              this.plugin.settings.moveImagesWithNote = value;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.storageMode === 'noteFolder') {
      new Setting(containerEl)
        .setName('Rename image folder')
        .setDesc('When a note is renamed, also rename its image folder')
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.renameImageFolder)
            .onChange(async (value) => {
              this.plugin.settings.renameImageFolder = value;
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName('Cleanup empty folders')
      .setDesc('Automatically delete empty image folders')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.cleanupEmptyFolders)
          .onChange(async (value) => {
            this.plugin.settings.cleanupEmptyFolders = value;
            await this.plugin.saveSettings();
          })
      );

    // ========================================
    // Link Format Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Link Format' });

    new Setting(containerEl)
      .setName('Link format')
      .setDesc('How image links are inserted into notes')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('wikilink', 'Wikilink (![[image.png]])')
          .addOption('wikilink-path', 'Wikilink with path (![[folder/image.png]])')
          .addOption('markdown-relative', 'Markdown relative (![](./image.png))')
          .addOption('markdown-absolute', 'Markdown absolute (![](/image.png))')
          .setValue(this.plugin.settings.linkFormat)
          .onChange(async (value) => {
            this.plugin.settings.linkFormat = value as LinkFormat;
            await this.plugin.saveSettings();
          })
      );

    // ========================================
    // Duplicate Detection Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Duplicate Detection' });

    new Setting(containerEl)
      .setName('Enable duplicate detection')
      .setDesc('Detect and handle duplicate images using content hash')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDuplicateDetection)
          .onChange(async (value) => {
            this.plugin.settings.enableDuplicateDetection = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.enableDuplicateDetection) {
      new Setting(containerEl)
        .setName('Duplicate action')
        .setDesc('What to do when a duplicate image is detected')
        .addDropdown((dropdown) =>
          dropdown
            .addOption('reuse', 'Reuse existing image')
            .addOption('ask', 'Ask each time')
            .addOption('rename', 'Create with new name')
            .setValue(this.plugin.settings.duplicateAction)
            .onChange(async (value) => {
              this.plugin.settings.duplicateAction = value as DuplicateAction;
              await this.plugin.saveSettings();
            })
        );
    }

    // ========================================
    // Orphan Image Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Orphan Images' });

    new Setting(containerEl)
      .setName('Auto-detect orphans')
      .setDesc('Automatically detect orphan images when notes are deleted')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoDetectOrphans)
          .onChange(async (value) => {
            this.plugin.settings.autoDetectOrphans = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Orphan handling')
      .setDesc('How to handle orphan images')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('markOnly', 'Mark only (show in gallery)')
          .addOption('moveToFolder', 'Move to orphan folder')
          .addOption('keep', 'Keep in place')
          .setValue(this.plugin.settings.orphanHandling)
          .onChange(async (value) => {
            this.plugin.settings.orphanHandling = value as OrphanHandling;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.orphanHandling === 'moveToFolder') {
      new Setting(containerEl)
        .setName('Orphan folder')
        .setDesc('Folder to move orphan images')
        .addText((text) =>
          text
            .setPlaceholder('_orphaned')
            .setValue(this.plugin.settings.orphanFolder)
            .onChange(async (value) => {
              this.plugin.settings.orphanFolder = value || '_orphaned';
              await this.plugin.saveSettings();
            })
        );
    }

    // ========================================
    // UI Settings
    // ========================================
    containerEl.createEl('h2', { text: 'Gallery UI' });

    new Setting(containerEl)
      .setName('Gallery columns')
      .setDesc('Number of columns in the gallery grid (3-6)')
      .addSlider((slider) =>
        slider
          .setLimits(3, 6, 1)
          .setValue(this.plugin.settings.galleryColumns)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.galleryColumns = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Thumbnail size')
      .setDesc('Size of image thumbnails in gallery')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('small', 'Small')
          .addOption('medium', 'Medium')
          .addOption('large', 'Large')
          .setValue(this.plugin.settings.thumbnailSize)
          .onChange(async (value) => {
            this.plugin.settings.thumbnailSize = value as 'small' | 'medium' | 'large';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show file info')
      .setDesc('Show file information panel in gallery')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showFileInfo)
          .onChange(async (value) => {
            this.plugin.settings.showFileInfo = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
