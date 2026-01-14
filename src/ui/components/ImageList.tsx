import * as React from 'react';
import { useCallback } from 'react';
import { ImageInfo, SortField, SortOrder } from '../../types';

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
      // Simulate ctrl+click for checkbox
      const syntheticEvent = {
        ...e,
        ctrlKey: true,
        metaKey: true,
      } as React.MouseEvent;
      onImageSelect(image, index, syntheticEvent);
    },
    [onImageSelect]
  );

  return (
    <div className="image-list-container">
      <table className="image-list">
        <thead>
          <tr>
            <th className="list-header-cell checkbox-cell" style={{ width: '40px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAllChange}
                className="select-all-checkbox"
                title={allSelected ? 'Deselect all' : 'Select all'}
              />
            </th>
            <th className="list-header-cell thumbnail-cell" style={{ width: '50px' }}>
              {/* Thumbnail column */}
            </th>
            <SortHeader
              label="Name"
              field="name"
              currentField={sortField}
              currentOrder={sortOrder}
              onClick={onSortChange}
            />
            <SortHeader
              label="Folder"
              field="path"
              currentField={sortField}
              currentOrder={sortOrder}
              onClick={onSortChange}
              width="150px"
            />
            <SortHeader
              label="Size"
              field="size"
              currentField={sortField}
              currentOrder={sortOrder}
              onClick={onSortChange}
              width="80px"
            />
            <SortHeader
              label="Created"
              field="created"
              currentField={sortField}
              currentOrder={sortOrder}
              onClick={onSortChange}
              width="100px"
            />
            <th className="list-header-cell" style={{ width: '70px' }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {images.map((image, index) => {
            const isSelected = selectedPaths.has(image.path);
            return (
              <tr
                key={image.path}
                className={`image-list-row ${isSelected ? 'selected' : ''} ${image.isOrphan ? 'orphan' : ''}`}
                onClick={(e) => handleRowClick(e, image, index)}
                onDoubleClick={() => onImageDoubleClick(image)}
              >
                <td className="list-cell checkbox-cell">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={(e) => handleCheckboxChange(e as unknown as React.MouseEvent, image, index)}
                    className="row-checkbox"
                  />
                </td>
                <td className="list-cell thumbnail-cell">
                  <div className="list-thumbnail">
                    <img
                      src={getResourcePath(image.path)}
                      alt={image.name}
                      loading="lazy"
                    />
                  </div>
                </td>
                <td className="list-cell name-cell" title={image.name}>
                  <span className="image-name">{image.name}</span>
                </td>
                <td className="list-cell folder-cell" title={getFolderPath(image.path)}>
                  <span className="folder-path">{getFolderPath(image.path)}</span>
                </td>
                <td className="list-cell size-cell">
                  {formatFileSize(image.size)}
                </td>
                <td className="list-cell date-cell">
                  {formatDate(image.created)}
                </td>
                <td className="list-cell status-cell">
                  {image.isOrphan ? (
                    <span className="status-badge orphan">Orphan</span>
                  ) : (
                    <span className="status-badge in-use">In Use</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
