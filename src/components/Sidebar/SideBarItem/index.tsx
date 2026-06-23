import type { SidebarItemProps } from "../types";

export function SidebarItem({
  label,
  icon,
  isActive,
  onClick,
  activeVariant = 'secondary',
}: SidebarItemProps) {
  const isSecondaryActive = isActive && activeVariant !== 'primary';
  const baseClass = "relative flex h-[44px] w-full items-center gap-3 rounded-lg px-[18px] text-[12px] font-semibold uppercase tracking-[0.07em] transition-all duration-300";
  
  const activeClass = activeVariant === 'primary' ? "bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/10" : "bg-white/[0.02] text-white font-bold border-l-2 border-[#d4af37]";
  const inactiveClass = "text-neutral-500 hover:bg-white/[0.035] hover:text-noir-champagne";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`${baseClass} ${isSecondaryActive ? 'pl-[22px]' : ''} ${isActive ? activeClass : inactiveClass}`}
    >
      {isSecondaryActive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-[3px] top-0 h-full w-3 text-noir-gold"
        >
          <svg className="h-full w-full" viewBox="0 0 12 44" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sidebar-active-bracket" x1="1" y1="0" x2="12" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="currentColor" />
                <stop offset="0.58" stopColor="currentColor" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M11 1.25H7.25C3.65 1.25 1.25 3.65 1.25 7.25V36.75C1.25 40.35 3.65 42.75 7.25 42.75H11"
              stroke="url(#sidebar-active-bracket)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center opacity-90">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
