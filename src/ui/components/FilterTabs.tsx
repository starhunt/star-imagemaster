import * as React from 'react';
import { GalleryFilter } from '../../types';

interface FilterTabsProps {
  filter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
  counts: {
    all: number;
    inUse: number;
    orphan: number;
  };
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  filter,
  onFilterChange,
  counts,
}) => {
  const tabs: Array<{ id: GalleryFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'inUse', label: 'In Use', count: counts.inUse },
    { id: 'orphan', label: 'Orphan', count: counts.orphan },
  ];

  return (
    <div style={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          style={{
            ...styles.tab,
            ...(filter === tab.id ? styles.activeTab : {}),
          }}
          className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
        >
          <span style={styles.label}>{tab.label}</span>
          <span
            style={{
              ...styles.count,
              ...(filter === tab.id ? styles.activeCount : {}),
              ...(tab.id === 'orphan' && tab.count > 0 ? styles.orphanCount : {}),
            }}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    borderBottom: '1px solid var(--background-modifier-border)',
    padding: '0 8px',
    gap: '4px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: 'var(--text-accent)',
    borderBottomColor: 'var(--interactive-accent)',
  },
  label: {},
  count: {
    background: 'var(--background-secondary)',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  activeCount: {
    background: 'var(--interactive-accent)',
    color: 'white',
  },
  orphanCount: {
    background: 'var(--text-error)',
    color: 'white',
  },
};
