import React, { useState, useEffect, useMemo } from 'react';

export default function SearchableSelect({
  label,
  placeholder,
  value,
  onChange,
  options = [],
  disabled = false,
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch(value || '');
    }
  }, [value, isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search || search === value) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, value]);

  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearch('');
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setSearch(value || '');
            }, 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-2.5 pr-8 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple transition-all disabled:opacity-50 text-text-primary"
        />
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary pointer-events-none text-[10px]">
          ▼
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-surface border border-border rounded-xl shadow-lg z-50 p-1 space-y-0.5">
          {filteredOptions.length === 0 ? (
            <p className="text-xs text-text-tertiary p-2 text-center">No results found</p>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt === value;
              return (
                <div
                  key={idx}
                  onMouseDown={() => {
                    onChange(opt);
                    setSearch(opt);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-purple/10 text-brand-purple font-bold'
                      : 'hover:bg-white/5 text-text-secondary'
                  }`}
                >
                  {opt}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
