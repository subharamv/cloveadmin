import { useState, useEffect, useRef } from 'react';
import { Phone, Search } from 'lucide-react';
import { searchVisitors, VisitorMatch } from './api';

interface PhoneSearchFieldProps {
  value: string;
  matchedName: string | null;
  onChange: (phone: string, matchedName: string | null) => void;
  disabled?: boolean;
}

export function PhoneSearchField({ value, matchedName, onChange, disabled }: PhoneSearchFieldProps) {
  const [matches, setMatches] = useState<VisitorMatch[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setMatches([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchVisitors(value);
        setMatches(results);
        setShowDropdown(results.length > 0);
      } catch {
        setMatches([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
        Mobile Number
      </label>
      <div className="relative">
        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '');
            onChange(digits, null);
          }}
          onFocus={() => setShowDropdown(matches.length > 0)}
          placeholder="Enter 10-digit mobile number"
          className="w-full pl-11 pr-4 py-3.5 text-base bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
          maxLength={10}
        />
      </div>

      {matchedName && (
        <p className="mt-1.5 text-xs text-[var(--text-secondary)] pl-1">
          Matched visitor: <span className="font-semibold text-[var(--text-primary)]">{matchedName}</span>
        </p>
      )}

      {showDropdown && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden">
          {matches.map((m) => (
            <button
              key={m.phone}
              type="button"
              onClick={() => {
                onChange(m.phone, m.name);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-color)] text-left transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <span className="font-mono font-semibold text-sm text-[var(--text-primary)]">{m.phone}</span>
              <span className="text-xs text-[var(--text-secondary)] truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
