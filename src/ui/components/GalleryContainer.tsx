import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Notice } from 'obsidian';
import ImageMasterPlugin from '../../main';
import { ImageInfo, GalleryFilter, ViewMode, SortField, SortOrder, sortImages } from '../../types';
import { ImageGrid } from './ImageGrid';
import { ImageList } from './ImageList';
import { InfoPanel } from './InfoPanel';
import { FilterTabs } from './FilterTabs';
import { ActionToolbar } from './ActionToolbar';
import { ViewModeToggle } from './ViewModeToggle';
import { SortDropdown } from './SortDropdown';

interface GalleryContainerProps {
  plugin: ImageMasterPlugin;
}

export const GalleryContainer: React.FC<GalleryContainerProps> = ({ plugin }) => {
  // Image data
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [focusedImage, setFocusedImage] = useState<ImageInfo | null>(null);

  // Action state
  const [isDeleting, setIsDeleting] = useState(false);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
      // Escape: Deselect all
      if (e.key === 'Escape') {
        deselectAll();
      }
      // Delete: Delete selected orphans
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPaths.size > 0) {
          e.preventDefault();
          handleBulkDelete();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPaths, images, filter]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const imageInfos = await plugin.orphanDetector.getAllImageInfos();
      setImages(imageInfos);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort images
  const filteredImages = useMemo(() => {
    let result = images;

    // Apply filter
    switch (filter) {
      case 'inUse':
        result = result.filter((img) => !img.isOrphan);
        break;
      case 'orphan':
        result = result.filter((img) => img.isOrphan);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (img) =>
          img.name.toLowerCase().includes(query) ||
          img.path.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result = sortImages(result, sortField, sortOrder);

    return result;
  }, [images, filter, searchQuery, sortField, sortOrder]);

  // Get selected images info
  const selectedImages = useMemo(() => {
    return filteredImages.filter((img) => selectedPaths.has(img.path));
  }, [filteredImages, selectedPaths]);

  // Selection handlers
  const handleImageSelect = useCallback(
    (image: ImageInfo, index: number, event: React.MouseEvent | React.KeyboardEvent) => {
      const isCtrlClick = 'ctrlKey' in event && (event.ctrlKey || event.metaKey);
      const isShiftClick = 'shiftKey' in event && event.shiftKey;

      if (isShiftClick && lastSelectedIndex !== null) {
        // Range selection
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSelection = new Set(selectedPaths);

        for (let i = start; i <= end; i++) {
          newSelection.add(filteredImages[i].path);
        }

        setSelectedPaths(newSelection);
      } else if (isCtrlClick) {
        // Toggle selection
        const newSelection = new Set(selectedPaths);
        if (newSelection.has(image.path)) {
          newSelection.delete(image.path);
        } else {
          newSelection.add(image.path);
        }
        setSelectedPaths(newSelection);
        setLastSelectedIndex(index);
      } else {
        // Single selection
        setSelectedPaths(new Set([image.path]));
        setLastSelectedIndex(index);
      }

      setFocusedImage(image);
    },
    [selectedPaths, lastSelectedIndex, filteredImages]
  );

  const handleImageDoubleClick = useCallback(
    (image: ImageInfo) => {
      // Insert image link into active editor
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        plugin.fileManager.insertImageLink(activeFile, image.path);
        new Notice(`Inserted: ${image.name}`);
      }
    },
    [plugin]
  );

  const selectAll = useCallback(() => {
    const allPaths = new Set(filteredImages.map((img) => img.path));
    setSelectedPaths(allPaths);
  }, [filteredImages]);

  const deselectAll = useCallback(() => {
    setSelectedPaths(new Set());
    setLastSelectedIndex(null);
  }, []);

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    const orphanPaths = selectedImages
      .filter((img) => img.isOrphan)
      .map((img) => img.path);

    if (orphanPaths.length === 0) {
      new Notice('No orphan images selected for deletion');
      return;
    }

    const confirmMessage =
      orphanPaths.length === 1
        ? `Delete "${orphanPaths[0].split('/').pop()}"?`
        : `Delete ${orphanPaths.length} orphan images?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deleted = await plugin.orphanDetector.deleteOrphanImages(orphanPaths);
      if (deleted > 0) {
        setImages((prev) => prev.filter((img) => !orphanPaths.includes(img.path)));
        setSelectedPaths((prev) => {
          const newSelection = new Set(prev);
          orphanPaths.forEach((path) => newSelection.delete(path));
          return newSelection;
        });
        new Notice(`Deleted ${deleted} image(s)`);
      }
    } catch (error) {
      console.error('Failed to delete images:', error);
      new Notice('Failed to delete some images');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedImages, plugin]);

  // Bulk move handler
  const handleBulkMove = useCallback(async () => {
    const targetFolder = prompt(
      'Enter target folder path:',
      plugin.settings.orphanFolder
    );

    if (!targetFolder) return;

    const pathsToMove = Array.from(selectedPaths);
    if (pathsToMove.length === 0) return;

    try {
      let movedCount = 0;
      for (const imagePath of pathsToMove) {
        const file = plugin.app.vault.getAbstractFileByPath(imagePath);
        if (file) {
          const fileName = imagePath.split('/').pop() || '';
          const newPath = `${targetFolder}/${fileName}`;

          // Ensure folder exists
          if (!plugin.app.vault.getAbstractFileByPath(targetFolder)) {
            await plugin.app.vault.createFolder(targetFolder);
          }

          await plugin.app.vault.rename(file, newPath);
          movedCount++;
        }
      }

      if (movedCount > 0) {
        new Notice(`Moved ${movedCount} image(s) to ${targetFolder}`);
        loadImages(); // Refresh
        deselectAll();
      }
    } catch (error) {
      console.error('Failed to move images:', error);
      new Notice('Failed to move some images');
    }
  }, [selectedPaths, plugin]);

  // Single image delete handler (from InfoPanel)
  const handleSingleDelete = useCallback(
    async (imagePath: string) => {
      if (!confirm('Are you sure you want to delete this image?')) {
        return;
      }

      const deleted = await plugin.orphanDetector.deleteOrphanImages([imagePath]);
      if (deleted > 0) {
        setImages((prev) => prev.filter((img) => img.path !== imagePath));
        setSelectedPaths((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(imagePath);
          return newSelection;
        });
        if (focusedImage?.path === imagePath) {
          setFocusedImage(null);
        }
      }
    },
    [plugin, focusedImage]
  );

  // Drag handler
  const handleDragStart = useCallback(
    (e: React.DragEvent, image: ImageInfo) => {
      const link = plugin.fileManager.formatImageLink(
        image.path,
        plugin.app.workspace.getActiveFile()!
      );
      e.dataTransfer.setData('text/plain', link);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [plugin]
  );

  // Sort handler
  const handleSortChange = useCallback((field: SortField, order?: SortOrder) => {
    if (order !== undefined) {
      setSortField(field);
      setSortOrder(order);
    } else {
      // Toggle order if same field clicked
      if (field === sortField) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    }
  }, [sortField]);

  // Resource path getter
  const getResourcePath = useCallback(
    (path: string) => plugin.app.vault.adapter.getResourcePath(path),
    [plugin]
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    loadImages();
    deselectAll();
  }, []);

  // Get counts for tabs
  const counts = useMemo(() => {
    return {
      all: images.length,
      inUse: images.filter((img) => !img.isOrphan).length,
      orphan: images.filter((img) => img.isOrphan).length,
    };
  }, [images]);

  return (
    <div className="image-master-gallery">
      {/* Header */}
      <div className="gallery-header">
        <h4>Image Gallery</h4>
        <div className="gallery-header-actions">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <button className="gallery-refresh-btn" onClick={handleRefresh} title="Refresh">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="gallery-toolbar">
        <div className="gallery-search">
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gallery-search-input"
          />
        </div>
        {viewMode === 'grid' && (
          <SortDropdown
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        )}
      </div>

      {/* Filter Tabs */}
      <FilterTabs filter={filter} onFilterChange={setFilter} counts={counts} />

      {/* Action Toolbar (shown when items selected) */}
      <ActionToolbar
        selectedImages={selectedImages}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onDeselect={deselectAll}
        isDeleting={isDeleting}
      />

      {/* Content */}
      <div className="gallery-content">
        {isLoading ? (
          <div className="gallery-loading">Loading images...</div>
        ) : filteredImages.length === 0 ? (
          <div className="gallery-empty">
            {searchQuery
              ? 'No images match your search'
              : filter === 'orphan'
              ? 'No orphan images found - all images are in use!'
              : filter === 'inUse'
              ? 'No images in use'
              : 'No images found in vault'}
          </div>
        ) : (
          <div className="gallery-main">
            {viewMode === 'grid' ? (
              <ImageGrid
                images={filteredImages}
                selectedPaths={selectedPaths}
                onImageSelect={handleImageSelect}
                onImageDoubleClick={handleImageDoubleClick}
                onDragStart={handleDragStart}
                columns={plugin.settings.galleryColumns}
                thumbnailSize={plugin.settings.thumbnailSize}
                getResourcePath={getResourcePath}
              />
            ) : (
              <ImageList
                images={filteredImages}
                selectedPaths={selectedPaths}
                onImageSelect={handleImageSelect}
                onImageDoubleClick={handleImageDoubleClick}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={(field) => handleSortChange(field)}
                getResourcePath={getResourcePath}
              />
            )}

            {plugin.settings.showFileInfo && focusedImage && selectedPaths.size === 1 && (
              <InfoPanel
                image={focusedImage}
                plugin={plugin}
                onDelete={handleSingleDelete}
                onClose={() => setFocusedImage(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="gallery-footer">
        <span>
          {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
          {selectedPaths.size > 0 && ` • ${selectedPaths.size} selected`}
        </span>
      </div>
    </div>
  );
};
