import * as React from 'react';
import { ImageInfo } from '../../types';

interface ActionToolbarProps {
  selectedImages: ImageInfo[];
  onDelete: () => void;
  onMove: () => void;
  onDeselect: () => void;
  isDeleting?: boolean;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  selectedImages,
  onDelete,
  onMove,
  onDeselect,
  isDeleting = false,
}) => {
  const selectedCount = selectedImages.length;
  const orphanCount = selectedImages.filter((img) => img.isOrphan).length;
  const inUseCount = selectedCount - orphanCount;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="action-toolbar">
      <div className="action-toolbar-info">
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
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="selection-count">
          {selectedCount} selected
          {orphanCount > 0 && inUseCount > 0 && (
            <span className="selection-detail">
              ({orphanCount} orphan, {inUseCount} in use)
            </span>
          )}
        </span>
      </div>

      <div className="action-toolbar-buttons">
        <button
          className="action-btn action-btn-danger"
          onClick={onDelete}
          disabled={isDeleting || orphanCount === 0}
          title={orphanCount === 0 ? 'Only orphan images can be deleted' : `Delete ${orphanCount} orphan image(s)`}
        >
          {isDeleting ? (
            <span className="loading-spinner" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          )}
          Delete{orphanCount > 0 && ` (${orphanCount})`}
        </button>

        <button
          className="action-btn"
          onClick={onMove}
          disabled={isDeleting}
          title="Move selected images to folder"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <polyline points="9 14 12 11 15 14" />
          </svg>
          Move to...
        </button>

        <button
          className="action-btn action-btn-secondary"
          onClick={onDeselect}
          disabled={isDeleting}
          title="Deselect all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Deselect
        </button>
      </div>
    </div>
  );
};
