import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, getPasswordValidationMessage, MIN_PASSWORD_LENGTH } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import type { PasswordInputProps, ResetPasswordScreenProps } from './types';

export function ResetPasswordScreen({ isAuthenticated }: ResetPasswordScreenProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthenticated && !window.location.search.includes('code=')) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const passwordError = getPasswordValidationMessage(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('As senhas informadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error.message));
      return;
    }

    setIsComplete(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-noir-base px-5 py-10 text-white">
      <section className="w-full max-w-[500px] rounded-2xl border border-white/10 bg-[#151517] p-7 shadow-2xl sm:p-9">
        <span className="font-serif text-[30px] font-extrabold italic leading-none text-noir-champagne lowercase">
          horizon<span className="text-noir-gold">.</span>
        </span>

        <p className="mt-10 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-noir-gold">
          Recuperação de conta
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black italic text-noir-champagne">Crie uma nova senha.</h1>

        {isComplete ? (
          <div className="mt-8">
            <p className="rounded-xl border border-noir-gold/25 bg-noir-gold/10 px-4 py-4 text-sm leading-6 text-noir-champagne">
              Sua senha foi atualizada com sucesso.
            </p>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-noir-gold font-mono text-xs font-black uppercase tracking-widest text-black hover:bg-noir-champagne"
            >
              Continuar
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <PasswordInput
              label="Nova senha"
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              onToggle={() => setShowPassword((currentValue) => !currentValue)}
            />
            <PasswordInput
              label="Confirmar nova senha"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              showPassword={showPassword}
            />
            <p className="text-xs leading-5 text-neutral-500">
              Mínimo de {MIN_PASSWORD_LENGTH} caracteres, com maiúscula, minúscula, número e símbolo.
            </p>

            {errorMessage && (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-noir-gold font-mono text-xs font-black uppercase tracking-widest text-black hover:bg-noir-champagne disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={17} className="animate-spin" />}
              Atualizar senha
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function PasswordInput({ label, onChange, onToggle, showPassword, value }: PasswordInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{label}</span>
      <span className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required
          autoComplete="new-password"
          className="h-[52px] w-full rounded-xl border border-white/10 bg-[#101012] px-4 pr-12 font-semibold outline-none focus:border-noir-gold"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
    </label>
  );
}
