'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const CustomSelect = ({ value, onChange, options, placeholder = 'Select...', disabled, isLoading }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-3 py-2 bg-secondary border border-border/40 rounded-lg text-[12px] font-medium transition-all group cursor-pointer
          ${isOpen ? 'border-indigo-500/40 ring-2 ring-indigo-500/5 shadow-lg shadow-indigo-500/5' : 'hover:border-border/80'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className={!selectedOption ? 'text-muted/60' : 'text-foreground'}>
          {isLoading ? 'Loading...' : (selectedOption ? selectedOption.label : placeholder)}
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-card border border-border/60 rounded-xl shadow-2xl p-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" size={12} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 bg-foreground/[0.02] border border-border/20 rounded-lg text-[11px] outline-none focus:border-foreground/20"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-[11px]
                    ${opt.id === value ? 'bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20' : 'hover:bg-muted text-foreground/80'}
                  `}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {opt.id === value && <Check size={12} />}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-[10px] text-muted italic">
                {placeholder || "No matches found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
