import { App, PluginSettingTab, Setting } from 'obsidian';
import ImageMasterPlugin from './main';
import {
  StorageMode,
  FilenamePattern,
  LinkFormat,
  OrphanHandling,
  DuplicateAction,
} from './types';
import { t, setLanguage, Language } from './i18n';

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
    // Language Setting
    // ========================================
    new Setting(containerEl)
      .setName(t('settings.language'))
      .setDesc(t('settings.language.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', 'Auto Detect')
          .addOption('ko', '한국어')
          .addOption('en', 'English')
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as Language;
            setLanguage(value as Language);
            await this.plugin.saveSettings();
            this.display(); // 언어 변경 시 UI 새로고침
          })
      );

    // ========================================
    // Storage Location Settings
    // ========================================
    containerEl.createEl('h2', { text: t('settings.storageLocation') });

    new Setting(containerEl)
      .setName(t('settings.storageMode'))
      .setDesc(t('settings.storageMode.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('folderBased', t('settings.storageMode.folderBased'))
          .addOption('central', t('settings.storageMode.central'))
          .addOption('dateBased', t('settings.storageMode.dateBased'))
          .addOption('noteFolder', t('settings.storageMode.noteFolder'))
          .addOption('sameAsNote', t('settings.storageMode.sameAsNote'))
          .setValue(this.plugin.settings.storageMode)
          .onChange(async (value) => {
            this.plugin.settings.storageMode = value as StorageMode;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    // Folder-based mode options
    if (this.plugin.settings.storageMode === 'folderBased') {
      new Setting(containerEl)
        .setName(t('settings.imageFolderSuffix'))
        .setDesc(t('settings.imageFolderSuffix.desc'))
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
        .setName(t('settings.centralFolder'))
        .setDesc(t('settings.centralFolder.desc'))
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
        .setName(t('settings.dateFormat'))
        .setDesc(t('settings.dateFormat.desc'))
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
    containerEl.createEl('h2', { text: t('settings.filename') });

    new Setting(containerEl)
      .setName(t('settings.filenamePattern'))
      .setDesc(t('settings.filenamePattern.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('original', t('settings.filenamePattern.original'))
          .addOption('timestamp', t('settings.filenamePattern.timestamp'))
          .addOption('uuid', t('settings.filenamePattern.uuid'))
          .addOption('hash', t('settings.filenamePattern.hash'))
          .addOption('custom', t('settings.filenamePattern.custom'))
          .setValue(this.plugin.settings.filenamePattern)
          .onChange(async (value) => {
            this.plugin.settings.filenamePattern = value as FilenamePattern;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.filenamePattern === 'custom') {
      new Setting(containerEl)
        .setName(t('settings.customPattern'))
        .setDesc(t('settings.customPattern.desc'))
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
    containerEl.createEl('h2', { text: t('settings.noteIntegration') });

    if (['folderBased', 'sameAsNote'].includes(this.plugin.settings.storageMode)) {
      new Setting(containerEl)
        .setName(t('settings.moveImagesWithNote'))
        .setDesc(t('settings.moveImagesWithNote.desc'))
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
        .setName(t('settings.renameImageFolder'))
        .setDesc(t('settings.renameImageFolder.desc'))
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
      .setName(t('settings.cleanupEmptyFolders'))
      .setDesc(t('settings.cleanupEmptyFolders.desc'))
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
    containerEl.createEl('h2', { text: t('settings.linkFormat') });

    new Setting(containerEl)
      .setName(t('settings.linkFormat.label'))
      .setDesc(t('settings.linkFormat.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('wikilink', t('settings.linkFormat.wikilink'))
          .addOption('wikilink-path', t('settings.linkFormat.wikilinkPath'))
          .addOption('markdown-relative', t('settings.linkFormat.markdownRelative'))
          .addOption('markdown-absolute', t('settings.linkFormat.markdownAbsolute'))
          .setValue(this.plugin.settings.linkFormat)
          .onChange(async (value) => {
            this.plugin.settings.linkFormat = value as LinkFormat;
            await this.plugin.saveSettings();
          })
      );

    // ========================================
    // Duplicate Detection Settings
    // ========================================
    containerEl.createEl('h2', { text: t('settings.duplicateDetection') });

    new Setting(containerEl)
      .setName(t('settings.enableDuplicateDetection'))
      .setDesc(t('settings.enableDuplicateDetection.desc'))
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
        .setName(t('settings.duplicateAction'))
        .setDesc(t('settings.duplicateAction.desc'))
        .addDropdown((dropdown) =>
          dropdown
            .addOption('reuse', t('settings.duplicateAction.reuse'))
            .addOption('ask', t('settings.duplicateAction.ask'))
            .addOption('rename', t('settings.duplicateAction.rename'))
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
    containerEl.createEl('h2', { text: t('settings.orphanImages') });

    new Setting(containerEl)
      .setName(t('settings.autoDetectOrphans'))
      .setDesc(t('settings.autoDetectOrphans.desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoDetectOrphans)
          .onChange(async (value) => {
            this.plugin.settings.autoDetectOrphans = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('settings.orphanHandling'))
      .setDesc(t('settings.orphanHandling.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('markOnly', t('settings.orphanHandling.markOnly'))
          .addOption('moveToFolder', t('settings.orphanHandling.moveToFolder'))
          .addOption('keep', t('settings.orphanHandling.keep'))
          .setValue(this.plugin.settings.orphanHandling)
          .onChange(async (value) => {
            this.plugin.settings.orphanHandling = value as OrphanHandling;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.orphanHandling === 'moveToFolder') {
      new Setting(containerEl)
        .setName(t('settings.orphanFolder'))
        .setDesc(t('settings.orphanFolder.desc'))
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
    containerEl.createEl('h2', { text: t('settings.galleryUI') });

    new Setting(containerEl)
      .setName(t('settings.galleryColumns'))
      .setDesc(t('settings.galleryColumns.desc'))
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
      .setName(t('settings.thumbnailSize'))
      .setDesc(t('settings.thumbnailSize.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('small', t('settings.thumbnailSize.small'))
          .addOption('medium', t('settings.thumbnailSize.medium'))
          .addOption('large', t('settings.thumbnailSize.large'))
          .setValue(this.plugin.settings.thumbnailSize)
          .onChange(async (value) => {
            this.plugin.settings.thumbnailSize = value as 'small' | 'medium' | 'large';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('settings.showFileInfo'))
      .setDesc(t('settings.showFileInfo.desc'))
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
