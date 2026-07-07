import { useState, useEffect, useRef } from 'react';
import { Briefcase, Search } from 'lucide-react';

export const OCCUPATION_OPTIONS = [
  'Bank Manager',
  'Bank Employee',
  'Branch Manager',
  'Sales Executive',
  'Sales Manager',
  'Marketing Executive',
  'Marketing Manager',
  'Business Development Executive',
  'Relationship Manager',
  'Account Manager',
  'HR Executive',
  'HR Manager',
  'Recruiter',
  'Accountant',
  'Auditor',
  'Finance Executive',
  'Chartered Accountant',
  'Software Engineer',
  'IT Support Engineer',
  'Network Engineer',
  'System Administrator',
  'Project Manager',
  'Consultant',
  'Architect',
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Surveyor',
  'Site Engineer',
  'Contractor',
  'Supervisor',
  'Technician',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Mason',
  'Painter',
  'Welder',
  'Fabricator',
  'Driver',
  'Delivery Executive',
  'Courier Executive',
  'Security Officer',
  'Housekeeping Staff',
  'Maintenance Technician',
  'Student',
  'Professor / Lecturer',
  'Teacher',
  'Research Scholar',
  'Government Officer',
  'Vendor Representative',
  'Procurement Officer',
  'Purchase Manager',
  'Supplier',
  'Distributor',
  'Dealer',
  'Franchise Owner',
  'CEO',
  'Managing Director',
  'Director',
  'Vice President',
  'General Manager',
  'Operations Manager',
  'Quality Engineer',
  'Quality Inspector',
  'Medical Representative',
  'Doctor',
  'Nurse',
  'Advocate / Lawyer',
  'Police Officer',
  'Journalist',
  'Media Representative',
  'Insurance Agent',
  'Real Estate Agent',
  'Farmer',
  'Business Owner',
  'Entrepreneur',
  'Freelancer',
  'Intern',
  'Volunteer',
  'NGO Representative',
  'Delivery Partner',
  'Service Engineer',
  'Field Executive',
  'Field Technician',
  'Machine Operator',
  'Factory Worker',
  'Warehouse Executive',
  'Logistics Coordinator',
  'Customs Agent',
];

interface OccupationFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function OccupationField({ value, onChange, disabled, required }: OccupationFieldProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = value.trim().length === 0
    ? OCCUPATION_OPTIONS
    : OCCUPATION_OPTIONS.filter((o) => o.toLowerCase().includes(value.trim().toLowerCase()));

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
      <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
        <Briefcase className="w-3.5 h-3.5" /> Occupation
      </label>
      <input
        type="text"
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        placeholder="e.g. Software Engineer"
        autoComplete="off"
        className="w-full px-4 py-3.5 text-base bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
      />

      {showDropdown && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto custom-scrollbar bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl shadow-lg">
          {matches.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-color)] text-left transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <span className="text-sm text-[var(--text-primary)] truncate">{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
