import * as React from 'react';
import { TFile } from 'obsidian';
import ImageMasterPlugin from '../../main';
import { ImageInfo } from '../../types';

interface InfoPanelProps {
  image: ImageInfo;
  plugin: ImageMasterPlugin;
  onDelete: (path: string) => void;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  image,
  plugin,
  onDelete,
  onClose,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const handleOpenInExplorer = () => {
    const file = plugin.app.vault.getAbstractFileByPath(image.path);
    if (file && file instanceof TFile) {
      // Open system file explorer at file location
      (plugin.app as any).showInFolder(file.path);
    }
  };

  const handleRename = async () => {
    const file = plugin.app.vault.getAbstractFileByPath(image.path);
    if (file && file instanceof TFile) {
      const newName = prompt('Enter new name:', image.name);
      if (newName && newName !== image.name) {
        const newPath = image.path.replace(image.name, newName);
        await plugin.app.vault.rename(file, newPath);
      }
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(image.path);
  };

  const handleCopyLink = () => {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (activeFile) {
      const link = plugin.fileManager.formatImageLink(image.path, activeFile);
      navigator.clipboard.writeText(link);
    } else {
      navigator.clipboard.writeText(`![[${image.path}]]`);
    }
  };

  const handleNavigateToNote = (notePath: string) => {
    const file = plugin.app.vault.getAbstractFileByPath(notePath);
    if (file && file instanceof TFile) {
      plugin.app.workspace.getLeaf().openFile(file);
    }
  };

  return (
    <div className="info-panel" style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <h5 style={styles.title}>Image Info</h5>
        <button onClick={onClose} style={styles.closeButton} title="Close">
          &times;
        </button>
      </div>

      {/* Preview */}
      <div style={styles.preview}>
        <img
          src={`app://local/${encodeURI(image.path)}`}
          alt={image.name}
          style={styles.previewImage}
        />
      </div>

      {/* Info */}
      <div style={styles.infoList}>
        <InfoRow label="Name" value={image.name} />
        <InfoRow label="Path" value={image.path} />
        <InfoRow label="Size" value={formatFileSize(image.size)} />
        <InfoRow label="Type" value={image.extension.toUpperCase()} />
        {image.width && image.height && (
          <InfoRow label="Dimensions" value={`${image.width} x ${image.height}`} />
        )}
        <InfoRow label="Created" value={formatDate(image.created)} />
        <InfoRow label="Modified" value={formatDate(image.modified)} />
        <InfoRow
          label="Status"
          value={image.isOrphan ? 'Orphan' : 'In Use'}
          valueStyle={image.isOrphan ? { color: 'var(--text-error)' } : { color: 'var(--text-success)' }}
        />
      </div>

      {/* Referenced Notes */}
      {image.referencedBy.length > 0 && (
        <div style={styles.section}>
          <h6 style={styles.sectionTitle}>Referenced by ({image.referencedBy.length})</h6>
          <div style={styles.noteList}>
            {image.referencedBy.map((notePath) => (
              <button
                key={notePath}
                onClick={() => handleNavigateToNote(notePath)}
                style={styles.noteLink}
              >
                {notePath.split('/').pop()?.replace('.md', '')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={handleCopyLink} style={styles.actionButton} title="Copy link">
          Copy Link
        </button>
        <button onClick={handleCopyPath} style={styles.actionButton} title="Copy path">
          Copy Path
        </button>
        <button onClick={handleRename} style={styles.actionButton} title="Rename">
          Rename
        </button>
        <button onClick={handleOpenInExplorer} style={styles.actionButton} title="Show in folder">
          Open Folder
        </button>
        {image.isOrphan && (
          <button
            onClick={() => onDelete(image.path)}
            style={{ ...styles.actionButton, ...styles.deleteButton }}
            title="Delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueStyle }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={{ ...styles.infoValue, ...valueStyle }}>{value}</span>
  </div>
);

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    width: '280px',
    minWidth: '280px',
    borderLeft: '1px solid var(--background-modifier-border)',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--background-primary)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid var(--background-modifier-border)',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '0 4px',
  },
  preview: {
    padding: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'var(--background-secondary)',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    objectFit: 'contain',
    borderRadius: '4px',
  },
  infoList: {
    padding: '12px',
    flex: 1,
    overflowY: 'auto',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    fontSize: '12px',
  },
  infoLabel: {
    color: 'var(--text-muted)',
    marginRight: '8px',
    flexShrink: 0,
  },
  infoValue: {
    color: 'var(--text-normal)',
    textAlign: 'right',
    wordBreak: 'break-all',
  },
  section: {
    padding: '0 12px 12px',
    borderTop: '1px solid var(--background-modifier-border)',
  },
  sectionTitle: {
    margin: '12px 0 8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  noteList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  noteLink: {
    background: 'var(--background-secondary)',
    border: 'none',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '12px',
    color: 'var(--text-accent)',
  },
  actions: {
    padding: '12px',
    borderTop: '1px solid var(--background-modifier-border)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  actionButton: {
    flex: '1 1 45%',
    padding: '6px 8px',
    fontSize: '11px',
    borderRadius: '4px',
    border: '1px solid var(--background-modifier-border)',
    background: 'var(--background-secondary)',
    cursor: 'pointer',
    color: 'var(--text-normal)',
  },
  deleteButton: {
    background: 'var(--background-modifier-error)',
    color: 'white',
    borderColor: 'var(--background-modifier-error)',
  },
};
