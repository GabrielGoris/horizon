import { AlertTriangle, Bell, CreditCard, LogOut, Shield, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CaptchaField } from '../../components/CaptchaField';
import { getAuthErrorMessage } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { SecuritySettings } from './components/SecuritySettings';
import type {
  AccountSettingsProps,
  DeleteAccountDialogProps,
  SettingsRowProps,
  SettingsScreenProps,
} from './types';

const settingsLinks = [
  { label: 'Conta', icon: <User size={15} strokeWidth={2.3} />, to: '/settings', end: true },
  { label: 'Seguranca', icon: <Shield size={15} strokeWidth={2.3} />, to: '/settings/security' },
  { label: 'Notificacoes', icon: <Bell size={15} strokeWidth={2.3} />, to: '/settings/notifications' },
  { label: 'Plano', icon: <CreditCard size={15} strokeWidth={2.3} />, to: '/settings/billing' },
];

export function SettingsScreen({ onSignOut, session }: SettingsScreenProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteDialogRequested, setIsDeleteDialogRequested] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteCaptchaResetKey, setDeleteCaptchaResetKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userEmail = session.user.email ?? 'Conta Horizon';
  const isSecuritySection = location.pathname === '/settings/security';
  const isSocialReauthenticated = new URLSearchParams(location.search).get('reauth') === 'delete';
  const providers = Array.isArray(session.user.app_metadata.providers)
    ? session.user.app_metadata.providers as string[]
    : [];
  const requiresPassword = providers.includes('email');
  const isDeleteDialogOpen = isDeleteDialogRequested || isSocialReauthenticated;
  const needsPasswordReauthentication = requiresPassword && !isSocialReauthenticated;

  const handleDeleteAccount = async (password: string, captchaToken: string | null) => {
    setIsDeletingAccount(true);
    setErrorMessage(null);

    try {
      let accessToken = session.access_token;

      if (needsPasswordReauthentication) {
        if (!session.user.email) throw new Error('Sua conta nao possui um e-mail confirmado.');

        const { data, error } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password,
          options: { captchaToken: captchaToken ?? undefined },
        });

        if (error || !data.session) throw new Error('A senha atual esta incorreta.');
        accessToken = data.session.access_token;

        const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
          setIsDeletingAccount(false);
          navigate('/settings?reauth=delete', { replace: true });
          return;
        }
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json() as { message?: string };

      if (!response.ok) throw new Error(result.message ?? 'Nao foi possivel excluir a conta.');
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel excluir a conta.');
      setIsDeletingAccount(false);
      setDeleteCaptchaResetKey((currentKey) => currentKey + 1);
    }
  };

  const handleSocialReauthentication = async () => {
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
        redirectTo: `${window.location.origin}/settings?reauth=delete`,
      },
    });

    if (error) setErrorMessage(getAuthErrorMessage(error.message));
  };

  const closeDeleteDialog = () => {
    if (isDeletingAccount) return;
    setIsDeleteDialogRequested(false);
    if (isSocialReauthenticated) navigate('/settings', { replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-noir-base font-sans text-white">
      <SettingsSidebar />

      <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="border-b border-white/5 pb-7">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-noir-gold">Configuracoes</p>
            <h1 className="mt-3 text-3xl font-bold text-white">{isSecuritySection ? 'Seguranca' : 'Conta'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              {isSecuritySection
                ? 'Fortaleca sua senha e configure uma segunda etapa de verificação.'
                : 'Gerencie seu acesso, sessão e informações principais do Horizon.'}
            </p>
          </header>

          {isSecuritySection ? (
            <SecuritySettings session={session} />
          ) : (
            <AccountSettings
              onOpenDelete={() => {
                setErrorMessage(null);
                setIsDeleteDialogRequested(true);
              }}
              onSignOut={onSignOut}
              userEmail={userEmail}
            />
          )}
        </div>
      </main>

      {isDeleteDialogOpen && (
        <DeleteAccountDialog
          errorMessage={errorMessage}
          captchaResetKey={deleteCaptchaResetKey}
          isDeleting={isDeletingAccount}
          isSocialReauthenticated={isSocialReauthenticated}
          onCancel={closeDeleteDialog}
          onConfirm={handleDeleteAccount}
          onSocialReauthenticate={handleSocialReauthentication}
          requiresPassword={needsPasswordReauthentication}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}

function AccountSettings({ onOpenDelete, onSignOut, userEmail }: AccountSettingsProps) {
  return (
    <>
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]">
        <SettingsRow label="E-mail" description="Endereco usado para acessar sua conta." value={userEmail} />
        <SettingsRow
          label="Sessao"
          description="Encerre o acesso neste dispositivo."
          action={(
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-300 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              <LogOut size={15} /> Sair
            </button>
          )}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]">
        <SettingsRow
          label="Excluir conta"
          description="Remove permanentemente sua conta e encerra seu acesso ao Horizon."
          action={(
            <button
              type="button"
              onClick={onOpenDelete}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-red-100 hover:bg-red-500/20"
            >
              <Trash2 size={15} /> Excluir
            </button>
          )}
        />
      </section>
    </>
  );
}

function SettingsSidebar() {
  return (
    <aside className="hidden h-screen w-[324px] shrink-0 flex-col border-r border-white/5 bg-noir-base px-[34px] py-9 md:flex">
      <div className="flex items-center gap-2">
        <span className="font-serif text-[31px] font-extrabold italic leading-none text-noir-champagne lowercase">
          horizon<span className="text-noir-gold">.</span>
        </span>
        <span className="mt-1 rounded border border-noir-gold/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-noir-gold/70">Noir</span>
      </div>

      <nav className="mt-[66px] flex flex-col gap-[14px]" aria-label="Configuracoes">
        <span className="mb-1 ml-4 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">Configuracoes</span>
        {settingsLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `relative flex h-[44px] w-full items-center gap-3 rounded-lg px-[18px] text-[12px] font-semibold uppercase tracking-[0.07em] transition-colors ${isActive ? 'bg-[linear-gradient(90deg,rgba(212,175,55,0.12)_0%,rgba(255,255,255,0.045)_44%,rgba(255,255,255,0.02)_100%)] text-white' : 'text-neutral-500 hover:bg-white/[0.035] hover:text-noir-champagne'}`}
          >
            {link.icon}<span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function SettingsRow({ action, description, label, value }: SettingsRowProps) {
  return (
    <div className="grid gap-5 border-b border-white/5 px-6 py-5 last:border-b-0 md:grid-cols-[220px_1fr_auto] md:items-center">
      <div><h2 className="text-sm font-bold text-white">{label}</h2><p className="mt-1 text-sm leading-5 text-neutral-500">{description}</p></div>
      <div className="min-w-0">{value && <p className="truncate rounded-lg border border-white/10 bg-[#131315] px-4 py-3 text-sm font-semibold text-neutral-200">{value}</p>}</div>
      {action && <div className="flex md:justify-end">{action}</div>}
    </div>
  );
}

function DeleteAccountDialog({
  captchaResetKey,
  errorMessage,
  isDeleting,
  isSocialReauthenticated,
  onCancel,
  onConfirm,
  onSocialReauthenticate,
  requiresPassword,
  userEmail,
}: DeleteAccountDialogProps) {
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const isEmailConfirmed = emailConfirmation.trim().toLowerCase() === userEmail.trim().toLowerCase();
  const canDelete = isEmailConfirmed && (requiresPassword ? Boolean(password) : isSocialReauthenticated);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-5 backdrop-blur-[5px]">
      <button type="button" aria-label="Cancelar exclusao" className="absolute inset-0 cursor-default" onClick={onCancel} />
      <section role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1e] shadow-[0_28px_90px_rgba(0,0,0,0.72)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300"><AlertTriangle size={18} /></span>
            <div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-red-300">Excluir conta</p><h2 id="delete-account-title" className="mt-1 font-serif text-xl font-extrabold text-white">Remover sua conta?</h2></div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar" disabled={isDeleting} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 disabled:opacity-60"><X size={18} /></button>
        </div>

        <div className="px-6 py-6">
          <p className="text-sm leading-6 text-neutral-300">Voce esta prestes a excluir a conta <strong className="font-semibold text-white">{userEmail}</strong>. Esta acao nao pode ser desfeita.</p>
          <label className="mt-5 flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Digite seu e-mail para confirmar</span>
            <input type="email" value={emailConfirmation} onChange={(event) => setEmailConfirmation(event.target.value)} autoComplete="off" className="h-11 rounded-lg border border-white/10 bg-[#101012] px-4 text-sm outline-none focus:border-red-300/50" />
          </label>

          {requiresPassword && (
            <>
              <label className="mt-4 flex flex-col gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Senha atual</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-11 rounded-lg border border-white/10 bg-[#101012] px-4 text-sm outline-none focus:border-red-300/50" />
              </label>
              <div className="mt-4">
                <CaptchaField onTokenChange={setCaptchaToken} resetKey={captchaResetKey} />
              </div>
            </>
          )}

          {!requiresPassword && !isSocialReauthenticated && (
            <button type="button" onClick={onSocialReauthenticate} disabled={isDeleting} className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-xs font-bold uppercase tracking-wider text-white">Confirmar identidade com Google</button>
          )}

          {errorMessage && <p className="mt-4 rounded-lg border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{errorMessage}</p>}
        </div>

        <footer className="flex gap-3 border-t border-white/10 bg-black/10 p-5">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-mono text-xs font-bold uppercase tracking-wide text-neutral-300 disabled:opacity-60">Cancelar</button>
          <button type="button" onClick={() => onConfirm(password, captchaToken)} disabled={isDeleting || !canDelete} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-4 font-mono text-xs font-bold uppercase tracking-wide text-red-200 disabled:opacity-40"><Trash2 size={16} />{isDeleting ? 'Excluindo' : 'Excluir'}</button>
        </footer>
      </section>
    </div>
  );
}
