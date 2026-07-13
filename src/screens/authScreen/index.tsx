import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { CaptchaField } from '../../components/CaptchaField';
import { getAuthErrorMessage, getPasswordValidationMessage, MIN_PASSWORD_LENGTH } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import type { AuthMode } from './types';

const authCopy = {
  login: {
    eyebrow: 'Acesso ao acervo',
    title: 'Bem-vindo ao Horizon.',
    description: 'Entre para continuar organizando suas obras preferidas no seu acervo.',
    submit: 'Entrar',
    swapText: 'Ainda nao tem conta?',
    swapAction: 'Criar registro',
  },
  register: {
    eyebrow: 'Novo registro',
    title: 'Bem-vindo ao Horizon.',
    description: 'Crie sua conta para manter sua biblioteca sempre atualizada.',
    submit: 'Registrar',
    swapText: 'Ja tem uma conta?',
    swapAction: 'Fazer login',
  },
  forgot: {
    eyebrow: 'Recuperar acesso',
    title: 'Redefina sua senha.',
    description: 'Enviaremos um link seguro para o seu e-mail cadastrado.',
    submit: 'Enviar link',
    swapText: 'Lembrou sua senha?',
    swapAction: 'Voltar ao login',
  },
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    const oauthError = new URLSearchParams(window.location.search).get('error_description');
    return oauthError ? getAuthErrorMessage(oauthError) : null;
  });
  const copy = authCopy[mode];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    const normalizedEmail = email.trim();
    let error: { message: string } | null;

    if (mode === 'register') {
      const passwordError = getPasswordValidationMessage(password);
      if (passwordError) {
        setIsSubmitting(false);
        setErrorMessage(passwordError);
        return;
      }

      ({ error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      }));
    } else if (mode === 'forgot') {
      ({ error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        captchaToken: captchaToken ?? undefined,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }));
    } else {
      ({ error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
        options: {
          captchaToken: captchaToken ?? undefined,
        },
      }));
    }

    setIsSubmitting(false);
    setCaptchaResetKey((currentKey) => currentKey + 1);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error.message));
      return;
    }

    if (mode === 'register') {
      setFeedback('Registro criado. Confirme seu e-mail antes de entrar.');
    }

    if (mode === 'forgot') {
      setFeedback('Se o e-mail estiver cadastrado, enviaremos um link de recuperação.');
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

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setErrorMessage(null);
    setFeedback(null);
    setCaptchaResetKey((currentKey) => currentKey + 1);
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
                autoComplete="email"
                className="h-[52px] rounded-xl border border-white/10 bg-[#101012] px-4 text-[15px] font-semibold text-white outline-none transition-all placeholder:text-neutral-700 focus:border-noir-gold focus:ring-1 focus:ring-noir-gold"
              />
            </label>

            {mode !== 'forgot' && (
              <label className="flex flex-col gap-2">
                <span className="flex items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Senha
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => changeMode('forgot')}
                      className="normal-case tracking-normal text-noir-gold transition-colors hover:text-noir-champagne"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </span>
                <span className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'register' ? `Minimo de ${MIN_PASSWORD_LENGTH} caracteres` : 'Sua senha'}
                    required
                    minLength={mode === 'register' ? MIN_PASSWORD_LENGTH : 1}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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
                {mode === 'register' && (
                  <span className="text-xs leading-5 text-neutral-600">
                    Use maiúscula, minúscula, número e símbolo.
                  </span>
                )}
              </label>
            )}

            <CaptchaField onTokenChange={setCaptchaToken} resetKey={captchaResetKey} />

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

            {mode !== 'forgot' && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
                className="flex h-[52px] items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-6 text-[11px] font-black uppercase tracking-[0.12em] text-noir-champagne transition-all hover:border-white/20 hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGoogleSubmitting ? <Loader2 size={17} className="animate-spin" /> : <FcGoogle size={18} />}
                Entrar com Google
              </button>
            )}
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <span>{copy.swapText}</span>
            <button
              type="button"
              onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
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
