export function AppSplash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#111114] px-8 text-center text-white">
      <div className="animate-horizon-splash-in flex flex-col items-center">
        <img src="/horizon-logo.png" alt="Horizon" className="h-auto w-40 max-w-[56vw] object-contain drop-shadow-[0_18px_44px_rgba(212,175,55,0.2)]" />
        <span className="mt-5 font-mono text-[9px] font-bold uppercase tracking-[0.38em] text-noir-gold/75">Sua biblioteca pessoal</span>
      </div>
    </div>
  );
}
