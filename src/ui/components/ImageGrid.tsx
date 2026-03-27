import * as React from 'react';
import { useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import { ImageInfo } from '../../types';
import { t } from '../../i18n';

interface ImageGridProps {
  images: ImageInfo[];
  selectedPaths: Set<string>;
  onImageSelect: (image: ImageInfo, index: number, event: React.MouseEvent | React.KeyboardEvent) => void;
  onImageDoubleClick: (image: ImageInfo) => void;
  onDragStart: (e: React.DragEvent, image: ImageInfo) => void;
  columns: number;
  thumbnailSize: 'small' | 'medium' | 'large';
  getResourcePath: (path: string) => string;
}

const GAP = 8;

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedPaths,
  onImageSelect,
  onImageDoubleClick,
  onDragStart,
  columns,
  thumbnailSize,
  getResourcePath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });

  // 컨테이너 크기 측정
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setContainerSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(images.length / columns);
  // 셀 크기 계산: 패딩 8px 양쪽 + 갭
  const cellWidth = Math.floor((containerSize.width - GAP * 2 - GAP * (columns - 1)) / columns);
  const cellHeight = cellWidth; // 1:1 비율

  const handleClick = useCallback(
    (e: React.MouseEvent, image: ImageInfo, index: number) => {
      onImageSelect(image, index, e);
    },
    [onImageSelect]
  );

  const handleDoubleClick = useCallback(
    (image: ImageInfo) => {
      onImageDoubleClick(image);
    },
    [onImageDoubleClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, image: ImageInfo, index: number) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onImageSelect(image, index, e);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (index < images.length - 1) {
            onImageSelect(images[index + 1], index + 1, e);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (index > 0) {
            onImageSelect(images[index - 1], index - 1, e);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (index + columns < images.length) {
            onImageSelect(images[index + columns], index + columns, e);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (index - columns >= 0) {
            onImageSelect(images[index - columns], index - columns, e);
          }
          break;
      }
    },
    [images, columns, onImageSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // react-window 셀 렌더러
  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
      const index = rowIndex * columns + columnIndex;
      if (index >= images.length) return null;

      const image = images[index];
      const isSelected = selectedPaths.has(image.path);

      return (
        <div
          style={{
            ...style,
            // 셀 내부 패딩/갭 조정
            left: Number(style.left) + GAP,
            top: Number(style.top) + GAP,
            width: Number(style.width) - GAP,
            height: Number(style.height) - GAP,
          }}
        >
          <div
            className={`image-grid-item ${isSelected ? 'selected' : ''} ${
              image.isOrphan ? 'orphan' : ''
            }`}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              position: 'relative',
              borderRadius: '4px',
              overflow: 'hidden',
              border: isSelected
                ? '2px solid var(--interactive-accent)'
                : '1px solid var(--background-modifier-border)',
            }}
            onClick={(e) => handleClick(e, image, index)}
            onDoubleClick={() => handleDoubleClick(image)}
            onKeyDown={(e) => handleKeyDown(e, image, index)}
            draggable
            onDragStart={(e) => onDragStart(e, image)}
            tabIndex={0}
            role="button"
            aria-label={t('image.selectAria', { name: image.name })}
            aria-selected={isSelected}
          >
            {/* Selection checkbox indicator */}
            {isSelected && (
              <div
                className="selection-check"
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  width: '20px',
                  height: '20px',
                  background: 'var(--interactive-accent)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {/* Thumbnail */}
            <img
              src={getResourcePath(image.path)}
              alt={image.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              loading="lazy"
            />

            {/* Orphan indicator */}
            {image.isOrphan && (
              <div
                className="orphan-badge"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'var(--text-error)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
                title={t('image.orphanTooltip')}
              >
                {t('image.orphan')}
              </div>
            )}

            {/* Filename overlay on hover */}
            <div
              className="image-grid-item-overlay"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                padding: '20px 6px 6px',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {image.name}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '10px',
                }}
              >
                {formatFileSize(image.size)}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [images, selectedPaths, columns, handleClick, handleDoubleClick, handleKeyDown, onDragStart, getResourcePath]
  );

  return (
    <div
      ref={containerRef}
      className="image-grid"
      style={{ flex: 1, overflow: 'hidden' }}
    >
      {containerSize.width > 0 && containerSize.height > 0 && (
        <FixedSizeGrid
          columnCount={columns}
          columnWidth={cellWidth + GAP}
          rowCount={rowCount}
          rowHeight={cellHeight + GAP}
          width={containerSize.width}
          height={containerSize.height}
          overscanRowCount={3}
        >
          {Cell}
        </FixedSizeGrid>
      )}

      <style>{`
        .image-grid-item:hover .image-grid-item-overlay {
          opacity: 1 !important;
        }
        .image-grid-item:focus {
          outline: 2px solid var(--interactive-accent);
          outline-offset: 2px;
        }
        .image-grid-item.orphan {
          border-color: var(--text-error) !important;
        }
        .image-grid-item.selected {
          box-shadow: 0 0 0 2px var(--interactive-accent);
        }
      `}</style>
    </div>
  );
};
