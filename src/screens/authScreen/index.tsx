import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../../lib/supabase';
import type { AuthMode } from './types';

const authCopy = {
  login: {
    eyebrow: 'Acesso ao acervo',
    title: 'Bem vindo ao Horizon.',
    description: 'Entre para continuar organizando suas obras preferidas no seu acervo.',
    submit: 'Entrar',
    swapText: 'Ainda não tem conta?',
    swapAction: 'Criar registro',
  },
  register: {
    eyebrow: 'Novo registro',
    title: 'Bem vindo ao Horizon.',
    description: 'Crie sua conta para manter sua biblioteca sempre atualizada.',
    submit: 'Registrar',
    swapText: 'Já tem uma conta?',
    swapAction: 'Fazer login',
  },
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const copy = authCopy[mode];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    const credentials = {
      email: email.trim(),
      password,
    };

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error.message));
      return;
    }

    if (mode === 'register') {
      setFeedback('Registro criado. Confirme seu e-mail antes de entrar.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsGoogleSubmitting(false);
      setErrorMessage(getAuthErrorMessage(error.message));
    }
  };

  const toggleMode = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
    setErrorMessage(null);
    setFeedback(null);
  };

  return (
    <main className="grid min-h-screen bg-noir-base text-white lg:grid-cols-[minmax(0,1fr)_minmax(560px,0.72fr)]">
      <section className="relative hidden overflow-hidden border-r border-white/5 bg-[#101012] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(212,175,55,0.13),transparent_27%),linear-gradient(135deg,rgba(235,220,185,0.06),transparent_35%),#101012]" />

        <div className="absolute left-12 top-10 flex items-center gap-2">
          <span className="font-serif text-[31px] font-extrabold italic leading-none text-noir-champagne lowercase">
            horizon<span className="text-noir-gold">.</span>
          </span>
          <span className="mt-1 rounded border border-noir-gold/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-noir-gold/70">
            Noir
          </span>
        </div>

        <div className="absolute bottom-14 left-12 right-12 max-w-[720px]">
          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-noir-gold">
            Biblioteca pessoal
          </p>
          <h1 className="max-w-[700px] font-serif text-[62px] font-black italic leading-[0.96] text-noir-champagne">
            Seu backlog com memória e prioridade.
          </h1>
          <p className="mt-6 max-w-[620px] text-sm leading-7 text-neutral-400">
            Um lugar para priorizar suas obras, sem deixar tudo virar uma lista solta.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[520px]">
          <div className="mb-10 lg:hidden">
            <span className="font-serif text-[32px] font-extrabold italic leading-none text-noir-champagne lowercase">
              horizon<span className="text-noir-gold">.</span>
            </span>
          </div>

          <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-noir-gold">
            {copy.eyebrow}
          </p>
          <h2 className="font-serif text-[46px] font-black italic leading-[0.98] text-noir-champagne">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-[500px] text-sm leading-7 text-neutral-400">{copy.description}</p>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                E-mail
              </span>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@horizon.app"
                required
                className="h-[52px] rounded-xl border border-white/10 bg-[#101012] px-4 text-[15px] font-semibold text-white outline-none transition-all placeholder:text-neutral-700 focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Senha
              </span>
              <span className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  minLength={6}
                  className="h-[52px] w-full rounded-xl border border-white/10 bg-[#101012] px-4 pr-12 text-[15px] font-semibold text-white outline-none transition-all placeholder:text-neutral-700 focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-noir-champagne"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {errorMessage && (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {errorMessage}
              </p>
            )}

            {feedback && (
              <p className="rounded-xl border border-noir-gold/25 bg-noir-gold/10 px-4 py-3 text-sm font-semibold text-noir-champagne">
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="mt-2 flex h-[52px] items-center justify-center gap-3 rounded-xl bg-noir-gold px-6 text-[12px] font-black uppercase tracking-[0.12em] text-black shadow-lg shadow-noir-gold/15 transition-all hover:bg-noir-champagne disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && <Loader2 size={17} className="animate-spin" />}
              {copy.submit}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="flex h-[52px] items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-6 text-[11px] font-black uppercase tracking-[0.12em] text-noir-champagne transition-all hover:border-white/20 hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGoogleSubmitting ? <Loader2 size={17} className="animate-spin" /> : <FcGoogle size={18} />}
              Entrar com Google
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <span>{copy.swapText}</span>
            <button
              type="button"
              onClick={toggleMode}
              className="font-bold text-noir-gold transition-colors hover:text-noir-champagne"
            >
              {copy.swapAction}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login')) {
    return 'E-mail ou senha incorretos.';
  }

  if (normalizedMessage.includes('already registered')) {
    return 'Esse e-mail já está registrado.';
  }

  if (normalizedMessage.includes('password')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  return 'Não foi possível concluir a autenticação agora.';
}
