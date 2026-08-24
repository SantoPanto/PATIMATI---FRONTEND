import React, { useEffect, useState } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";

export interface SortOption {
  label: string;
  value: string;
}

export interface AdminFilterBarProps {
  searchQuery?: string;
  onSearchChange: (query: string) => void;
  sortOrder?: string;
  onSortChange: (sort: string) => void;
  placeholder?: string;
  sortOptions?: SortOption[];
  className?: string;
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { label: "En Yeni", value: "createdAt,desc" },
  { label: "En Eski", value: "createdAt,asc" },
];

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchQuery = "",
  onSearchChange,
  sortOrder = "createdAt,desc",
  onSortChange,
  placeholder = "Arama yapın...",
  sortOptions = DEFAULT_SORT_OPTIONS,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedSearch = useDebounce(inputValue, 500);

  // Sync internal input state if searchQuery prop changes externally (e.g. cleared by parent)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Trigger parent search handler on debounced value change
  useEffect(() => {
    // Only notify parent if debounced value is different from searchQuery prop
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, searchQuery]);

  const handleClear = () => {
    setInputValue("");
    onSearchChange("");
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full ${className}`}
    >
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-300"
            aria-label="Aramayı temizle"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Sort Select */}
      <div className="relative min-w-[160px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <ArrowUpDown size={16} />
        </div>
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs appearance-none cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <svg
            className="w-4 h-4 fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AdminFilterBar;
