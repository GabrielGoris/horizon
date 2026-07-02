import { NavLink } from "react-router-dom";
import type { SidebarItemProps } from "../types";

export function SidebarItem({
  label,
  icon,
  to,
  end,
  activeVariant = 'secondary',
}: SidebarItemProps) {
  const baseClass = "relative flex h-[44px] w-full items-center gap-3 rounded-lg px-[18px] text-[12px] font-semibold uppercase tracking-[0.07em] transition-colors duration-150";
  
  const activeClass = activeVariant === 'primary' ? "bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/10" : "bg-[linear-gradient(90deg,rgba(212,175,55,0.12)_0%,rgba(255,255,255,0.045)_44%,rgba(255,255,255,0.02)_100%)] text-white font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]";
  const inactiveClass = "text-neutral-500 hover:bg-white/[0.035] hover:text-noir-champagne";

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
      }}
    >
      {({ isActive }) => {
        return (
          <>
            <span className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center ${isActive ? 'opacity-95' : 'opacity-70'}`}>
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </>
        );
      }}
    </NavLink>
  );
}
