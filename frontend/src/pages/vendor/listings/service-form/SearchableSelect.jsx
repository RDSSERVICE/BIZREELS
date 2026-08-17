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
    <div className="relative font-sans">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
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
          className="w-full p-2.5 pr-8 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all disabled:opacity-50"
        />
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none text-[10px]">
          ▼
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-[#e3dccb] rounded-xl shadow-xl z-50 p-1 space-y-0.5">
          {filteredOptions.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 text-center">No results found</p>
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
                  className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#241b15] text-[#d99a3d]'
                      : 'hover:bg-[#f8f4ec] text-[#1a1a1a]'
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
