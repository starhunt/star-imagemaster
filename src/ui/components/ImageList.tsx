import * as React from 'react';
import { useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { ImageInfo, SortField, SortOrder } from '../../types';
import { t } from '../../i18n';

interface ImageListProps {
  images: ImageInfo[];
  selectedPaths: Set<string>;
  onImageSelect: (image: ImageInfo, index: number, event: React.MouseEvent) => void;
  onImageDoubleClick: (image: ImageInfo) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
  getResourcePath: (path: string) => string;
}

const ROW_HEIGHT = 44;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getFolderPath = (path: string): string => {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : '/';
};

interface SortHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onClick: (field: SortField) => void;
  width?: string;
}

const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  field,
  currentField,
  currentOrder,
  onClick,
  width,
}) => {
  const isActive = currentField === field;
  return (
    <th
      className={`list-header-cell sortable ${isActive ? 'active' : ''}`}
      onClick={() => onClick(field)}
      style={{ width }}
    >
      <span>{label}</span>
      {isActive && (
        <span className="sort-indicator">
          {currentOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </th>
  );
};

export const ImageList: React.FC<ImageListProps> = ({
  images,
  selectedPaths,
  onImageSelect,
  onImageDoubleClick,
  onSelectAll,
  onDeselectAll,
  sortField,
  sortOrder,
  onSortChange,
  getResourcePath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // 컨테이너 높이 측정
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      // 헤더 높이(약 36px) 제외
      setContainerHeight(el.clientHeight - 36);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Calculate selection state for header checkbox
  const allSelected = images.length > 0 && images.every(img => selectedPaths.has(img.path));
  const someSelected = images.some(img => selectedPaths.has(img.path));
  const isIndeterminate = someSelected && !allSelected;

  const handleSelectAllChange = useCallback(() => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [allSelected, onSelectAll, onDeselectAll]);

  const handleRowClick = useCallback(
    (e: React.MouseEvent, image: ImageInfo, index: number) => {
      onImageSelect(image, index, e);
    },
    [onImageSelect]
  );

  const handleCheckboxChange = useCallback(
    (e: React.MouseEvent, image: ImageInfo, index: number) => {
      e.stopPropagation();
      const syntheticEvent = {
        ...e,
        ctrlKey: true,
        metaKey: true,
      } as React.MouseEvent;
      onImageSelect(image, index, syntheticEvent);
    },
    [onImageSelect]
  );

  // react-window 행 렌더러
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const image = images[index];
      const isSelected = selectedPaths.has(image.path);

      return (
        <div
          style={style}
          className={`image-list-row ${isSelected ? 'selected' : ''} ${image.isOrphan ? 'orphan' : ''}`}
          onClick={(e) => handleRowClick(e, image, index)}
          onDoubleClick={() => onImageDoubleClick(image)}
        >
          <div className="list-cell checkbox-cell" style={{ width: '40px' }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              onClick={(e) => handleCheckboxChange(e as unknown as React.MouseEvent, image, index)}
              className="row-checkbox"
            />
          </div>
          <div className="list-cell thumbnail-cell" style={{ width: '50px' }}>
            <div className="list-thumbnail">
              <img
                src={getResourcePath(image.path)}
                alt={image.name}
                loading="lazy"
              />
            </div>
          </div>
          <div className="list-cell name-cell" title={image.name} style={{ flex: 1 }}>
            <span className="image-name">{image.name}</span>
          </div>
          <div className="list-cell folder-cell" title={getFolderPath(image.path)} style={{ width: '150px' }}>
            <span className="folder-path">{getFolderPath(image.path)}</span>
          </div>
          <div className="list-cell size-cell" style={{ width: '80px' }}>
            {formatFileSize(image.size)}
          </div>
          <div className="list-cell date-cell" style={{ width: '100px' }}>
            {formatDate(image.created)}
          </div>
          <div className="list-cell status-cell" style={{ width: '70px' }}>
            {image.isOrphan ? (
              <span className="status-badge orphan">{t('list.orphan')}</span>
            ) : (
              <span className="status-badge in-use">{t('list.inUse')}</span>
            )}
          </div>
        </div>
      );
    },
    [images, selectedPaths, handleRowClick, onImageDoubleClick, handleCheckboxChange, getResourcePath]
  );

  return (
    <div ref={containerRef} className="image-list-container" style={{ flex: 1, overflow: 'hidden' }}>
      {/* 고정 헤더 */}
      <div className="image-list-header">
        <div className="list-header-cell checkbox-cell" style={{ width: '40px' }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={handleSelectAllChange}
            className="select-all-checkbox"
            title={allSelected ? t('action.deselectAll') : t('action.selectAll')}
          />
        </div>
        <div className="list-header-cell thumbnail-cell" style={{ width: '50px' }} />
        <div
          className={`list-header-cell sortable ${sortField === 'name' ? 'active' : ''}`}
          onClick={() => onSortChange('name')}
          style={{ flex: 1 }}
        >
          <span>{t('list.name')}</span>
          {sortField === 'name' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
        </div>
        <div
          className={`list-header-cell sortable ${sortField === 'path' ? 'active' : ''}`}
          onClick={() => onSortChange('path')}
          style={{ width: '150px' }}
        >
          <span>{t('list.folder')}</span>
          {sortField === 'path' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
        </div>
        <div
          className={`list-header-cell sortable ${sortField === 'size' ? 'active' : ''}`}
          onClick={() => onSortChange('size')}
          style={{ width: '80px' }}
        >
          <span>{t('list.size')}</span>
          {sortField === 'size' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
        </div>
        <div
          className={`list-header-cell sortable ${sortField === 'created' ? 'active' : ''}`}
          onClick={() => onSortChange('created')}
          style={{ width: '100px' }}
        >
          <span>{t('list.created')}</span>
          {sortField === 'created' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
        </div>
        <div className="list-header-cell" style={{ width: '70px' }}>
          {t('list.status')}
        </div>
      </div>

      {/* 가상화된 행 목록 */}
      {containerHeight > 0 && (
        <FixedSizeList
          itemCount={images.length}
          itemSize={ROW_HEIGHT}
          height={Math.max(containerHeight, 100)}
          width="100%"
          overscanCount={10}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  );
};
