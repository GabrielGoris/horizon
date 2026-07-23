import { Download, LoaderCircle, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  downloadAppUpdate,
  getAvailableAppUpdate,
  type AvailableAppUpdate,
} from "../../services/appUpdateService";

function getReleaseHighlights(notes: string) {
  return notes
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function AppUpdateDialog() {
  const [availableUpdate, setAvailableUpdate] = useState<AvailableAppUpdate | null>(null);
  const [isOpeningDownload, setIsOpeningDownload] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const getUpdate = useCallback(() => getAvailableAppUpdate(), []);

  useEffect(() => {
    let isMounted = true;

    getUpdate().then((update) => {
      if (isMounted) setAvailableUpdate(update);
    });

    return () => {
      isMounted = false;
    };
  }, [getUpdate]);

  const handleDownload = async () => {
    if (!availableUpdate) return;

    setIsOpeningDownload(true);
    setDownloadError(false);

    try {
      await downloadAppUpdate(availableUpdate.downloadUrl);
    } catch (error) {
      console.error("Não foi possível abrir o download da atualização.", error);
      setDownloadError(true);
    } finally {
      setIsOpeningDownload(false);
    }
  };

  if (!availableUpdate) return null;

  const highlights = getReleaseHighlights(availableUpdate.notes);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Atualizar mais tarde" className="absolute inset-0 cursor-default" onMouseDown={() => setAvailableUpdate(null)} />
      <section role="dialog" aria-modal="true" aria-labelledby="app-update-title" className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-noir-gold/25 bg-[#19191c] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        <header className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.13),rgba(255,255,255,0.02))] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-noir-gold/30 bg-noir-gold/10 text-noir-gold"><Sparkles size={19} /></span>
            <button type="button" onClick={() => setAvailableUpdate(null)} aria-label="Atualizar mais tarde" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-500 transition hover:text-white"><X size={16} /></button>
          </div>
          <p className="mt-5 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-noir-gold">Atualização disponível</p>
          <h2 id="app-update-title" className="mt-2 font-serif text-2xl font-bold italic text-noir-champagne">Uma versão nova do Horizon está pronta.</h2>
          <p className="mt-2 text-sm text-neutral-400">Versão {availableUpdate.version}</p>
        </header>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-neutral-300">Baixe a atualização para continuar com a versão mais recente do Horizon.</p>
          {highlights.length > 0 && (
            <ul className="mt-4 space-y-2 border-l border-noir-gold/30 pl-4 text-sm leading-5 text-neutral-400">
              {highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
            </ul>
          )}
          {downloadError && <p className="mt-4 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">Não foi possível abrir o download. Tente novamente.</p>}
        </div>

        <footer className="flex gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={() => setAvailableUpdate(null)} disabled={isOpeningDownload} className="h-10 flex-1 rounded-lg border border-white/10 px-4 text-xs font-bold text-neutral-400 transition hover:text-white disabled:opacity-50">Agora não</button>
          <button type="button" onClick={() => void handleDownload()} disabled={isOpeningDownload} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-noir-gold px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black transition hover:bg-noir-champagne disabled:opacity-50">
            {isOpeningDownload ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
            Baixar APK
          </button>
        </footer>
      </section>
    </div>
  );
}
