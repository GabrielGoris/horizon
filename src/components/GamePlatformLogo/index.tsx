import { FaAndroid, FaApple, FaXbox } from "react-icons/fa";
import {
  SiEpicgames,
  SiGogdotcom,
  SiPlaystation,
  SiPlaystation2,
  SiPlaystation3,
  SiPlaystation4,
  SiPlaystation5,
  SiPlaystationportable,
  SiPlaystationvita,
  SiSega,
  SiSteam,
} from "react-icons/si";
import type { IconType } from "react-icons";
import type { GamePlatformOption } from "../../consts/gamePlatforms";

function NintendoLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 28" aria-hidden="true" className={className}>
      <rect x="3" y="4" width="90" height="20" rx="10" fill="none" stroke="currentColor" strokeWidth="4" />
      <text x="48" y="18" fill="currentColor" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" textAnchor="middle">
        Nintendo
      </text>
    </svg>
  );
}

function SwitchLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 36" aria-hidden="true" className={className}>
      <path d="M20 4h10v28H20c-7.7 0-14-6.3-14-14S12.3 4 20 4Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M34 4h10c7.7 0 14 6.3 14 14s-6.3 14-14 14H34V4Z" fill="currentColor" />
      <circle cx="23" cy="14" r="3" fill="currentColor" />
      <circle cx="42" cy="22" r="3" fill="#151519" />
    </svg>
  );
}

function GameCubeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true" className={className}>
      <path d="M21 3 36.6 12v18L21 39 5.4 30V12L21 3Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M21 11.5 29.2 16v10L21 30.5 12.8 26V16L21 11.5Z" fill="currentColor" opacity="0.24" />
      <path d="M21 3v8.5M36.6 12l-7.4 4M5.4 12l7.4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function TextLogo({ label, className }: { label: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 28" aria-hidden="true" className={className}>
      <text x="32" y="18" fill="currentColor" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="900" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}

function SkullBonesLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path
        d="M13.5 49.2 50.5 12.3M13.5 12.3l37 36.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <circle cx="11" cy="51" r="4.2" fill="currentColor" />
      <circle cx="18" cy="44" r="4.2" fill="currentColor" />
      <circle cx="53" cy="51" r="4.2" fill="currentColor" />
      <circle cx="46" cy="44" r="4.2" fill="currentColor" />
      <circle cx="11" cy="13" r="4.2" fill="currentColor" />
      <circle cx="18" cy="20" r="4.2" fill="currentColor" />
      <circle cx="53" cy="13" r="4.2" fill="currentColor" />
      <circle cx="46" cy="20" r="4.2" fill="currentColor" />

      <path
        d="M32 9c-11 0-19 7.5-19 18.1 0 7.2 3.5 10.8 7.7 13.3v8.1c0 2.6 2.1 4.6 4.7 4.6h13.2c2.6 0 4.7-2 4.7-4.6v-8.1C47.5 37.9 51 34.3 51 27.1 51 16.5 43 9 32 9Z"
        fill="#151519"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <circle cx="25" cy="29" r="4.3" fill="currentColor" />
      <circle cx="39" cy="29" r="4.3" fill="currentColor" />
      <path d="M32 34.5 28.7 42h6.6L32 34.5Z" fill="currentColor" />
      <path d="M25.5 47h13" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function CompactSkullLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M16 4.5c-6.7 0-11 4.2-11 10.2 0 3.9 1.8 6.2 4.3 7.7v3.1c0 1.3 1.1 2.4 2.4 2.4h8.6c1.3 0 2.4-1.1 2.4-2.4v-3.1c2.5-1.5 4.3-3.8 4.3-7.7 0-6-4.3-10.2-11-10.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="12" cy="15.5" r="2.4" fill="currentColor" />
      <circle cx="20" cy="15.5" r="2.4" fill="currentColor" />
      <path d="M16 19.2 13.8 24h4.4L16 19.2Z" fill="currentColor" />
    </svg>
  );
}

const iconByKind: Partial<Record<GamePlatformOption["kind"], IconType>> = {
  steam: SiSteam,
  epic: SiEpicgames,
  gog: SiGogdotcom,
  playstation: SiPlaystation,
  ps2: SiPlaystation2,
  ps3: SiPlaystation3,
  ps4: SiPlaystation4,
  ps5: SiPlaystation5,
  psp: SiPlaystationportable,
  psvita: SiPlaystationvita,
  xbox: FaXbox,
  sega: SiSega,
  android: FaAndroid,
  apple: FaApple,
};

export function GamePlatformLogo({ platform, className, compact = false }: { platform: GamePlatformOption; className?: string; compact?: boolean }) {
  if (platform.kind === "pirate") {
    return compact ? <CompactSkullLogo className={className} /> : <SkullBonesLogo className={className} />;
  }
  if (platform.kind === "nintendo") return <NintendoLogo className={className} />;
  if (platform.kind === "switch") return <SwitchLogo className={className} />;
  if (platform.kind === "gamecube") return <GameCubeLogo className={className} />;
  if (platform.kind === "arcade") return <TextLogo label="ARCADE" className={className} />;
  if (platform.kind === "emu") return <TextLogo label="EMU" className={className} />;

  const Icon = iconByKind[platform.kind];

  return Icon ? <Icon className={className} /> : <TextLogo label={platform.label} className={className} />;
}
