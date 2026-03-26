import * as React from 'react';
import { SortField, SortOrder } from '../../types';
import { t, TranslationKey } from '../../i18n';

interface SortDropdownProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

const SORT_OPTIONS: { value: SortField; labelKey: TranslationKey }[] = [
  { value: 'name', labelKey: 'sort.name' },
  { value: 'size', labelKey: 'sort.size' },
  { value: 'created', labelKey: 'sort.created' },
  { value: 'modified', labelKey: 'sort.modified' },
  { value: 'path', labelKey: 'sort.folder' },
];

export const SortDropdown: React.FC<SortDropdownProps> = ({
  sortField,
  sortOrder,
  onSortChange,
}) => {
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortField, sortOrder);
  };

  const toggleOrder = () => {
    onSortChange(sortField, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="sort-dropdown">
      <select
        className="sort-select"
        value={sortField}
        onChange={handleFieldChange}
        title={t('sort.sortBy')}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
      <button
        className="sort-order-btn"
        onClick={toggleOrder}
        title={sortOrder === 'asc' ? t('sort.ascending') : t('sort.descending')}
      >
        {sortOrder === 'asc' ? (
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
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        )}
      </button>
    </div>
  );
};
