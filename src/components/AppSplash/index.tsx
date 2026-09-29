interface AppSplashProps {
  onStart?: () => void;
}

export function AppSplash({ onStart }: AppSplashProps) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#111114] px-8 text-center text-white">
      <div className="animate-horizon-splash-in flex flex-col items-center">
        <img src="/horizon-logo.png" alt="Horizon" className="h-auto w-40 max-w-[56vw] object-contain drop-shadow-[0_18px_44px_rgba(212,175,55,0.2)]" />
        <span className="mt-5 font-mono text-[9px] font-bold uppercase tracking-[0.38em] text-noir-gold/75">Sua biblioteca pessoal</span>
        {onStart && (
          <button
            type="button"
            onClick={onStart}
            className="mt-9 rounded-sm border border-noir-gold/50 bg-noir-gold/10 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-noir-gold transition-colors hover:bg-noir-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-gold/70"
          >
            Iniciar Horizon
          </button>
        )}
      </div>
    </div>
  );
}
