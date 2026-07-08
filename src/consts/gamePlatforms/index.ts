export const GAME_PLATFORM_OPTIONS = [
  { label: "Steam", aliases: ["steam"], kind: "steam" },
  { label: "Epic", aliases: ["epic", "epic games"], kind: "epic" },
  { label: "GOG", aliases: ["gog"], kind: "gog" },
  { label: "Outros", aliases: ["outros", "pirata", "other"], kind: "pirate" },
  { label: "PS1", aliases: ["ps1", "playstation", "playstation 1"], kind: "playstation" },
  { label: "PS2", aliases: ["ps2", "playstation 2"], kind: "ps2" },
  { label: "PS3", aliases: ["ps3", "playstation 3"], kind: "ps3" },
  { label: "PS4", aliases: ["ps4", "playstation 4"], kind: "ps4" },
  { label: "PS5", aliases: ["ps5", "playstation 5"], kind: "ps5" },
  { label: "PSP", aliases: ["psp"], kind: "psp" },
  { label: "PS Vita", aliases: ["vita", "ps vita", "playstation vita"], kind: "psvita" },
  { label: "Xbox", aliases: ["xbox"], kind: "xbox" },
  { label: "Xbox 360", aliases: ["xbox 360"], kind: "xbox" },
  { label: "Xbox One", aliases: ["xbox one"], kind: "xbox" },
  { label: "Xbox Series", aliases: ["xbox series", "series x", "series s"], kind: "xbox" },
  { label: "Switch", aliases: ["switch", "nintendo switch"], kind: "switch" },
  { label: "Switch 2", aliases: ["switch 2", "nintendo switch 2"], kind: "switch" },
  { label: "GameCube", aliases: ["gamecube", "game cube"], kind: "gamecube" },
  { label: "Wii", aliases: ["wii"], kind: "nintendo" },
  { label: "Wii U", aliases: ["wii u", "wiiu"], kind: "nintendo" },
  { label: "NES", aliases: ["nes", "nintendo entertainment system"], kind: "nintendo" },
  { label: "SNES", aliases: ["snes", "super nintendo"], kind: "nintendo" },
  { label: "N64", aliases: ["n64", "nintendo 64"], kind: "nintendo" },
  { label: "Game Boy", aliases: ["game boy", "gameboy", "gb"], kind: "nintendo" },
  { label: "GBA", aliases: ["gba", "game boy advance"], kind: "nintendo" },
  { label: "DS", aliases: ["ds", "nintendo ds"], kind: "nintendo" },
  { label: "3DS", aliases: ["3ds", "nintendo 3ds"], kind: "nintendo" },
  { label: "Dreamcast", aliases: ["dreamcast"], kind: "sega" },
  { label: "Saturn", aliases: ["saturn", "sega saturn"], kind: "sega" },
  { label: "Mega Drive", aliases: ["mega drive", "genesis", "sega genesis"], kind: "sega" },
  { label: "Arcade", aliases: ["arcade"], kind: "arcade" },
  { label: "Android", aliases: ["android", "mobile"], kind: "android" },
  { label: "iOS", aliases: ["ios", "iphone", "ipad"], kind: "apple" },
  { label: "Emulador", aliases: ["emulador", "emulator"], kind: "emu" },
] as const;

export type GamePlatformOption = (typeof GAME_PLATFORM_OPTIONS)[number];

export function getGamePlatformOption(value?: string | null) {
  const normalizedValue = value?.toLowerCase().trim();

  if (!normalizedValue) return null;

  const exactMatch = GAME_PLATFORM_OPTIONS.find((option) => normalizedValue === option.label.toLowerCase());

  if (exactMatch) return exactMatch;

  return GAME_PLATFORM_OPTIONS.find((option) => (
    option.aliases.some((alias) => normalizedValue.includes(alias))
  )) ?? null;
}
