import { CheckCircle2, KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CaptchaField } from '../../../../components/CaptchaField';
import { getAuthErrorMessage, getPasswordValidationMessage, MIN_PASSWORD_LENGTH } from '../../../../lib/auth';
import { supabase } from '../../../../lib/supabase';
import type {
  SecurityFeedbackProps,
  SecurityPasswordInputProps,
  SecuritySettingsProps,
  TotpEnrollment,
} from './types';

export function SecuritySettings({ session }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isUpdatingMfa, setIsUpdatingMfa] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaFeedback, setMfaFeedback] = useState<string | null>(null);
  const providers = Array.isArray(session.user.app_metadata.providers)
    ? session.user.app_metadata.providers as string[]
    : [];
  const canUsePassword = providers.includes('email');

  const refreshFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setMfaError(getAuthErrorMessage(error.message));
      return;
    }

    const verifiedFactor = data.totp.find((factor) => factor.status === 'verified');
    setVerifiedFactorId(verifiedFactor?.id ?? null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!isMounted) return;

      if (error) {
        setMfaError(getAuthErrorMessage(error.message));
        return;
      }

      const verifiedFactor = data.totp.find((factor) => factor.status === 'verified');
      setVerifiedFactorId(verifiedFactor?.id ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordFeedback(null);

    const validationError = getPasswordValidationMessage(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (newPassword !== passwordConfirmation) {
      setPasswordError('As senhas informadas não coincidem.');
      return;
    }

    if (!session.user.email) {
      setPasswordError('Sua conta não possui um e-mail confirmado.');
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      current_password: currentPassword,
      password: newPassword,
    });
    setIsChangingPassword(false);

    if (error) {
      setPasswordError(getAuthErrorMessage(error.message));
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirmation('');
    setPasswordFeedback('Senha atualizada com sucesso.');
  };

  const handleSendPasswordLink = async () => {
    if (!session.user.email) return;

    setPasswordError(null);
    setPasswordFeedback(null);
    setIsChangingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      captchaToken: captchaToken ?? undefined,
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setCaptchaResetKey((currentKey) => currentKey + 1);
    setIsChangingPassword(false);

    if (error) {
      setPasswordError(getAuthErrorMessage(error.message));
      return;
    }

    setPasswordFeedback('Enviamos o link de definicao de senha para o seu e-mail.');
  };

  const handleStartMfaEnrollment = async () => {
    setIsUpdatingMfa(true);
    setMfaError(null);
    setMfaFeedback(null);

    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const unverifiedFactors = factorsData?.totp.filter((factor) => factor.status !== 'verified') ?? [];
    await Promise.all(unverifiedFactors.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })));

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Horizon Authenticator',
      issuer: 'Horizon',
    });
    setIsUpdatingMfa(false);

    if (error) {
      setMfaError(getAuthErrorMessage(error.message));
      return;
    }

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const handleVerifyMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enrollment) return;

    setIsUpdatingMfa(true);
    setMfaError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code: totpCode.trim(),
    });
    setIsUpdatingMfa(false);

    if (error) {
      setTotpCode('');
      setMfaError(getAuthErrorMessage(error.message));
      return;
    }

    setEnrollment(null);
    setTotpCode('');
    setMfaFeedback('Verificacao em duas etapas ativada. As outras sessoes foram encerradas.');
    await refreshFactors();
  };

  const handleDisableMfa = async () => {
    if (!verifiedFactorId) return;

    setIsUpdatingMfa(true);
    setMfaError(null);
    setMfaFeedback(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
    setIsUpdatingMfa(false);

    if (error) {
      setMfaError(getAuthErrorMessage(error.message));
      return;
    }

    setVerifiedFactorId(null);
    setMfaFeedback('Verificacao em duas etapas desativada.');
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-white/10 bg-[#1a1a1e] p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-noir-gold/25 bg-noir-gold/10 text-noir-gold">
            <KeyRound size={18} />
          </span>
          <div>
            <h2 className="font-bold text-white">Senha</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">Use uma senha exclusiva e atualize-a com confirmacao da credencial atual.</p>
          </div>
        </div>

        {canUsePassword ? (
          <form onSubmit={handleChangePassword} className="mt-6 grid gap-4 md:grid-cols-3">
            <SecurityPasswordInput label="Senha atual" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <SecurityPasswordInput label="Nova senha" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <SecurityPasswordInput label="Confirmar senha" value={passwordConfirmation} onChange={setPasswordConfirmation} autoComplete="new-password" />
            <p className="text-xs leading-5 text-neutral-500 md:col-span-3">
              ínimo de {MIN_PASSWORD_LENGTH} caracteres, com maiúscula, minúscula, número e símbolo.
            </p>
            <SecurityFeedback error={passwordError} feedback={passwordFeedback} />
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-noir-gold px-5 font-mono text-xs font-black uppercase tracking-wider text-black disabled:opacity-60 md:col-start-3"
            >
              {isChangingPassword && <Loader2 size={16} className="animate-spin" />}
              Atualizar senha
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-neutral-400">Sua conta usa login social. Você pode definir uma senha por um link enviado ao e-mail confirmado.</p>
            <div className="mt-4">
              <CaptchaField onTokenChange={setCaptchaToken} resetKey={captchaResetKey} />
            </div>
            <SecurityFeedback error={passwordError} feedback={passwordFeedback} />
            <button
              type="button"
              onClick={handleSendPasswordLink}
              disabled={isChangingPassword}
              className="mt-4 flex h-11 items-center gap-2 rounded-lg border border-white/10 px-5 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60"
            >
              {isChangingPassword && <Loader2 size={16} className="animate-spin" />}
              Enviar link seguro
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1a1a1e] p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-noir-gold/25 bg-noir-gold/10 text-noir-gold">
            {verifiedFactorId ? <ShieldCheck size={19} /> : <ShieldOff size={19} />}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-white">Verificação em duas etapas</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">Proteja sua conta com código de um aplicativo autenticador.</p>
              </div>
              {verifiedFactorId && (
                <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  <CheckCircle2 size={14} /> Ativa
                </span>
              )}
            </div>

            {enrollment && (
              <form onSubmit={handleVerifyMfa} className="mt-6 grid gap-6 md:grid-cols-[190px_1fr] md:items-center">
                <img src={enrollment.qrCode} alt="QR code para configurar o aplicativo autenticador" className="h-[190px] w-[190px] rounded-xl bg-white p-3" />
                <div>
                  <p className="text-sm leading-6 text-neutral-300">Escaneie o QR code e confirme o codigo gerado. Se preferir, use a chave:</p>
                  <code className="mt-2 block break-all rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-noir-champagne">{enrollment.secret}</code>
                  <input
                    value={totpCode}
                    onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    className="mt-4 h-11 w-full rounded-lg border border-white/10 bg-[#101012] px-4 text-center font-mono text-lg tracking-[0.35em] outline-none focus:border-noir-gold"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingMfa || totpCode.length !== 6}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-noir-gold font-mono text-xs font-black uppercase tracking-wider text-black disabled:opacity-60"
                  >
                    {isUpdatingMfa && <Loader2 size={16} className="animate-spin" />}
                    Confirmar ativacao
                  </button>
                </div>
              </form>
            )}

            <SecurityFeedback error={mfaError} feedback={mfaFeedback} />

            {!enrollment && (
              <button
                type="button"
                onClick={verifiedFactorId ? handleDisableMfa : handleStartMfaEnrollment}
                disabled={isUpdatingMfa}
                className={`mt-5 flex h-11 items-center gap-2 rounded-lg border px-5 font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-60 ${verifiedFactorId ? 'border-red-400/25 text-red-200' : 'border-noir-gold/30 text-noir-gold'}`}
              >
                {isUpdatingMfa && <Loader2 size={16} className="animate-spin" />}
                {verifiedFactorId ? 'Desativar 2FA' : 'Ativar 2FA'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SecurityPasswordInput({ autoComplete, label, onChange, value }: SecurityPasswordInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
      <input
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-11 rounded-lg border border-white/10 bg-[#101012] px-4 text-sm outline-none focus:border-noir-gold"
      />
    </label>
  );
}

function SecurityFeedback({ error, feedback }: SecurityFeedbackProps) {
  if (!error && !feedback) return null;

  return (
    <p className={`mt-4 rounded-lg border px-4 py-3 text-sm md:col-span-3 ${error ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>
      {error ?? feedback}
    </p>
  );
}
