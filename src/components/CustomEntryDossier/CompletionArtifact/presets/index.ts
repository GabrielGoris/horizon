export type CompletionArtifactVariant =
  | "archive"
  | "visit"
  | "dining"
  | "game"
  | "purchase"
  | "exhibition"
  | "theater"
  | "keepsake"
  | "library"
  | "checklist";

export interface CompletionArtifactPreset {
  variant: CompletionArtifactVariant;
  eyebrow: string;
  status: string;
  surfaceClass: string;
  accentClass: string;
  badgeClass: string;
  buttonClass: string;
}

const PRESETS: Record<string, CompletionArtifactPreset> = {
  folder: {
    variant: "archive",
    eyebrow: "Ficha de arquivo",
    status: "Item catalogado",
    surfaceClass: "border-amber-200/15 bg-[#29251f]",
    accentClass: "text-amber-200",
    badgeClass: "border-amber-200/15 bg-amber-200/10 text-amber-100",
    buttonClass: "bg-amber-200 text-[#211d17] hover:bg-amber-100",
  },
  "map-pin": {
    variant: "visit",
    eyebrow: "Passaporte de visita",
    status: "Destino visitado",
    surfaceClass: "border-sky-200/15 bg-[#172532]",
    accentClass: "text-sky-200",
    badgeClass: "border-sky-200/15 bg-sky-200/10 text-sky-100",
    buttonClass: "bg-sky-200 text-[#101d27] hover:bg-sky-100",
  },
  utensils: {
    variant: "dining",
    eyebrow: "Comanda da casa",
    status: "Experiência servida",
    surfaceClass: "border-orange-200/15 bg-[#30231d]",
    accentClass: "text-orange-200",
    badgeClass: "border-orange-200/15 bg-orange-200/10 text-orange-100",
    buttonClass: "bg-orange-200 text-[#281a14] hover:bg-orange-100",
  },
  dices: {
    variant: "game",
    eyebrow: "Ficha de partida",
    status: "Sessão concluída",
    surfaceClass: "border-emerald-200/15 bg-[#172a25]",
    accentClass: "text-emerald-200",
    badgeClass: "border-emerald-200/15 bg-emerald-200/10 text-emerald-100",
    buttonClass: "bg-emerald-200 text-[#10231e] hover:bg-emerald-100",
  },
  "shopping-bag": {
    variant: "purchase",
    eyebrow: "Comprovante de aquisição",
    status: "Compra registrada",
    surfaceClass: "border-violet-200/15 bg-[#251f32]",
    accentClass: "text-violet-200",
    badgeClass: "border-violet-200/15 bg-violet-200/10 text-violet-100",
    buttonClass: "bg-violet-200 text-[#1e172a] hover:bg-violet-100",
  },
  exhibition: {
    variant: "exhibition",
    eyebrow: "Credencial de galeria",
    status: "Exposição visitada",
    surfaceClass: "border-stone-200/15 bg-[#242320]",
    accentClass: "text-stone-200",
    badgeClass: "border-stone-200/15 bg-stone-200/10 text-stone-100",
    buttonClass: "bg-stone-100 text-[#242320] hover:bg-white",
  },
  theater: {
    variant: "theater",
    eyebrow: "Programa de espetáculo",
    status: "Espetáculo assistido",
    surfaceClass: "border-red-200/15 bg-[#2d1718]",
    accentClass: "text-amber-200",
    badgeClass: "border-amber-200/15 bg-amber-200/10 text-amber-100",
    buttonClass: "bg-amber-200 text-[#2d1718] hover:bg-amber-100",
  },
  heart: {
    variant: "keepsake",
    eyebrow: "Cartão de lembrança",
    status: "Lembrança guardada",
    surfaceClass: "border-rose-200/15 bg-[#321d25]",
    accentClass: "text-rose-200",
    badgeClass: "border-rose-200/15 bg-rose-200/10 text-rose-100",
    buttonClass: "bg-rose-200 text-[#2b151d] hover:bg-rose-100",
  },
  "book-marked": {
    variant: "library",
    eyebrow: "Cartão de biblioteca",
    status: "Leitura registrada",
    surfaceClass: "border-yellow-100/15 bg-[#2c291d]",
    accentClass: "text-yellow-100",
    badgeClass: "border-yellow-100/15 bg-yellow-100/10 text-yellow-50",
    buttonClass: "bg-yellow-100 text-[#252114] hover:bg-yellow-50",
  },
  list: {
    variant: "checklist",
    eyebrow: "Registro de conclusão",
    status: "Checklist arquivado",
    surfaceClass: "border-cyan-100/15 bg-[#1d292c]",
    accentClass: "text-cyan-100",
    badgeClass: "border-cyan-100/15 bg-cyan-100/10 text-cyan-50",
    buttonClass: "bg-cyan-100 text-[#142326] hover:bg-cyan-50",
  },
};

export function getCompletionArtifactPreset(icon: string) {
  return PRESETS[icon] ?? PRESETS.folder;
}
