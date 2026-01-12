import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import ImageMasterPlugin from '../main';
import { GalleryContainer } from './components/GalleryContainer';

export const GALLERY_VIEW_TYPE = 'image-master-gallery';

export class GalleryView extends ItemView {
  plugin: ImageMasterPlugin;
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: ImageMasterPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return GALLERY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Image Gallery';
  }

  getIcon(): string {
    return 'image';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('image-master-gallery-container');

    // Create React root and render
    this.root = createRoot(container);
    this.root.render(
      <React.StrictMode>
        <GalleryContainer plugin={this.plugin} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    // Cleanup React root
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
