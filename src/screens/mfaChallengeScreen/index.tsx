import { KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { getAuthErrorMessage } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import type { MfaChallengeScreenProps } from './types';

export function MfaChallengeScreen({ onVerified }: MfaChallengeScreenProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!isMounted) return;

      if (error) {
        setErrorMessage(getAuthErrorMessage(error.message));
        return;
      }

      const factor = data.totp.find((candidate) => candidate.status === 'verified');
      setFactorId(factor?.id ?? null);
      if (!factor) setErrorMessage('Nenhum autenticador verificado foi encontrado.');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!factorId) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setIsSubmitting(false);

    if (error) {
      setCode('');
      setErrorMessage(getAuthErrorMessage(error.message));
      return;
    }

    onVerified();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-noir-base px-5 text-white">
      <section className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#171719] p-8 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-noir-gold/25 bg-noir-gold/10 text-noir-gold">
          <KeyRound size={22} />
        </span>
        <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-noir-gold">Verificação em duas etapas</p>
        <h1 className="mt-3 font-serif text-4xl font-black italic text-noir-champagne">Confirme que é você.</h1>
        <p className="mt-4 text-sm leading-6 text-neutral-400">Digite o código de seis dígitos do seu aplicativo autenticador.</p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            aria-label="Codigo do autenticador"
            className="h-14 rounded-xl border border-white/10 bg-[#101012] px-4 text-center font-mono text-2xl tracking-[0.45em] outline-none focus:border-noir-gold"
            required
          />

          {errorMessage && <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !factorId || code.length !== 6}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-noir-gold font-mono text-xs font-black uppercase tracking-widest text-black disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={17} className="animate-spin" />}
            Verificar
          </button>
        </form>
      </section>
    </main>
  );
}
