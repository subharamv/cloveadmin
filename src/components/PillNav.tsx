import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  ariaLabel?: string;
}

interface PillNavProps {
  logo?: string;
  logoAlt?: string;
  items: NavItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
}

const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeId,
  onItemClick,
  className = '',
  baseColor = '#3b82f6',
  pillColor,
  hoveredPillTextColor,
  pillTextColor,
  onMobileMenuClick,
}) => {
  return (
    <div className={cn("w-full relative flex items-center justify-center py-1.5", className)}>
      {/* Scrollable Container with Hidden Scrollbars */}
      <div className="w-full flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar scrollbar-none py-1 px-4 gap-1 select-none">
        {logo && (
          <div className="flex-shrink-0 mr-4 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--border-color)] overflow-hidden">
            <img src={logo} alt={logoAlt} className="w-full h-full object-cover" />
          </div>
        )}

        <ul className="flex items-center gap-1.5 md:gap-2 flex-nowrap" role="menubar">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const Icon = item.icon;

            return (
              <li key={item.id} role="none" className="relative flex-shrink-0">
                <button
                  role="menuitem"
                  onClick={() => onItemClick(item.id)}
                  aria-label={item.ariaLabel || item.label}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-[10px] md:text-xs font-mono font-bold tracking-wider transition-colors duration-200 outline-none flex items-center gap-2 cursor-pointer select-none",
                    isActive
                      ? "text-blue-600 dark:text-blue-400 font-extrabold"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {/* Sliding Capsule Backdrop (Framer Motion) */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-500/20 rounded-full z-0 shadow-inner shadow-blue-500/5"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon & Label */}
                  <span className="relative z-10 flex items-center gap-1.5 md:gap-2">
                    {Icon && (
                      <Icon 
                        size={12} 
                        className={cn(
                          "transition-transform duration-200",
                          isActive ? "text-blue-500 scale-110" : "opacity-60 text-inherit"
                        )} 
                      />
                    )}
                    <span>{item.label}</span>
                  </span>

                  {/* Active Indicator Micro Dot */}
                  {isActive && (
                    <motion.span
                      layoutId="active-pill-dot"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full blur-[0.5px]"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
