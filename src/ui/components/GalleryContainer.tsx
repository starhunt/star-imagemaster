import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import ImageMasterPlugin from '../../main';
import { ImageInfo, GalleryFilter } from '../../types';
import { ImageGrid } from './ImageGrid';
import { InfoPanel } from './InfoPanel';
import { FilterTabs } from './FilterTabs';

interface GalleryContainerProps {
  plugin: ImageMasterPlugin;
}

export const GalleryContainer: React.FC<GalleryContainerProps> = ({ plugin }) => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);

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

  // Filter images based on current filter and search
  const filteredImages = React.useMemo(() => {
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

    return result;
  }, [images, filter, searchQuery]);

  // Handle image selection
  const handleImageSelect = useCallback((image: ImageInfo) => {
    setSelectedImage(image);
  }, []);

  // Handle image deletion
  const handleImageDelete = useCallback(
    async (imagePath: string) => {
      if (!confirm('Are you sure you want to delete this image?')) {
        return;
      }

      const deleted = await plugin.orphanDetector.deleteOrphanImages([imagePath]);
      if (deleted > 0) {
        setImages((prev) => prev.filter((img) => img.path !== imagePath));
        if (selectedImage?.path === imagePath) {
          setSelectedImage(null);
        }
      }
    },
    [plugin, selectedImage]
  );

  // Handle drag start for inserting image into editor
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

  // Refresh images
  const handleRefresh = useCallback(() => {
    loadImages();
  }, []);

  // Get counts for tabs
  const counts = React.useMemo(() => {
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

      {/* Search */}
      <div className="gallery-search">
        <input
          type="text"
          placeholder="Search images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="gallery-search-input"
        />
      </div>

      {/* Filter Tabs */}
      <FilterTabs filter={filter} onFilterChange={setFilter} counts={counts} />

      {/* Content */}
      <div className="gallery-content">
        {isLoading ? (
          <div className="gallery-loading">Loading images...</div>
        ) : filteredImages.length === 0 ? (
          <div className="gallery-empty">
            {searchQuery ? 'No images match your search' : 'No images found'}
          </div>
        ) : (
          <div className="gallery-main">
            <ImageGrid
              images={filteredImages}
              selectedImage={selectedImage}
              onImageSelect={handleImageSelect}
              onDragStart={handleDragStart}
              columns={plugin.settings.galleryColumns}
              thumbnailSize={plugin.settings.thumbnailSize}
            />

            {plugin.settings.showFileInfo && selectedImage && (
              <InfoPanel
                image={selectedImage}
                plugin={plugin}
                onDelete={handleImageDelete}
                onClose={() => setSelectedImage(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="gallery-footer">
        <span>
          {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
