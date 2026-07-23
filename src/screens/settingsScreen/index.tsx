import { AlertTriangle, ArrowLeft, Bell, CreditCard, LogOut, Plug, Shield, Trash2, User, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getApiUrl } from '../../services/apiUrl';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { SecuritySettings } from './components/SecuritySettings';
import { SteamIntegrationSettings } from './components/SteamIntegrationSettings';
import { getPushPermissionState, sendPushNotificationTest } from '../../services/pushNotificationService';
import type {
  AccountSettingsProps,
  DeleteAccountDialogProps,
  SettingsRowProps,
  SettingsScreenProps,
} from './types';

const settingsLinks = [
  { label: 'Conta', icon: <User size={15} strokeWidth={2.3} />, to: '/settings', end: true },
  { label: 'Segurança', icon: <Shield size={15} strokeWidth={2.3} />, to: '/settings/security' },
  { label: 'Integrações', icon: <Plug size={15} strokeWidth={2.3} />, to: '/settings/integrations' },
  { label: 'Notificações', icon: <Bell size={15} strokeWidth={2.3} />, to: '/settings/notifications' },
  { label: 'Plano', icon: <CreditCard size={15} strokeWidth={2.3} />, to: '/settings/billing' },
];

export function SettingsScreen({ onSignOut, session }: SettingsScreenProps) {
  const location = useLocation();
  const [isDeleteDialogRequested, setIsDeleteDialogRequested] = useState(false);
  const [isSignOutDialogRequested, setIsSignOutDialogRequested] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userEmail = session.user.email ?? 'Conta Horizon';
  const isSecuritySection = location.pathname === '/settings/security';
  const isIntegrationsSection = location.pathname === '/settings/integrations';
  const isNotificationsSection = location.pathname === '/settings/notifications';
  const isBillingSection = location.pathname === '/settings/billing';
  const sectionTitle = isSecuritySection ? 'Segurança' : isIntegrationsSection ? 'Integrações' : isNotificationsSection ? 'Notificações' : isBillingSection ? 'Plano' : 'Conta';

  const handleDeleteAccount = async (email: string, password: string) => {
    setIsDeletingAccount(true);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('/api/delete-account'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { message?: string };

      if (!response.ok) throw new Error(result.message ?? 'não foi possivel excluir a conta.');
      await onSignOut();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'não foi possivel excluir a conta.');
      setIsDeletingAccount(false);
    }
  };

  const closeDeleteDialog = () => {
    if (isDeletingAccount) return;
    setIsDeleteDialogRequested(false);
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-noir-base font-sans text-white md:h-screen md:overflow-hidden">
      <SettingsSidebar />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 sm:py-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <SettingsMobileTopBar userEmail={userEmail} />
          <header className="border-b border-white/5 pb-7">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-noir-gold">Configurações</p>
            <h1 className="mt-3 text-3xl font-bold text-white">{sectionTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              {isSecuritySection
                ? 'Fortaleca sua senha e configure uma segunda etapa de verificação.'
                : isIntegrationsSection
                  ? 'Conecte suas plataformas e mantenha sua biblioteca sincronizada.'
                  : isNotificationsSection
                    ? 'Defina como o Horizon deve avisar você sobre sua biblioteca.'
                    : isBillingSection
                      ? 'Acompanhe o plano associado à sua conta Horizon.'
                  : 'Gerencie seu acesso, sessão e informações principais do Horizon.'}
            </p>
          </header>

          {isSecuritySection ? (
            <SecuritySettings session={session} />
          ) : isIntegrationsSection ? (
            <SteamIntegrationSettings session={session} />
          ) : isNotificationsSection ? (
            <NotificationSettings session={session} />
          ) : isBillingSection ? (
            <PlanSettings />
          ) : (
            <AccountSettings
              onOpenDelete={() => {
                setErrorMessage(null);
                setIsDeleteDialogRequested(true);
              }}
              onRequestSignOut={() => setIsSignOutDialogRequested(true)}
              userEmail={userEmail}
            />
          )}
        </div>
      </main>

      {isDeleteDialogRequested && (
        <DeleteAccountDialog
          errorMessage={errorMessage}
          isDeleting={isDeletingAccount}
          onCancel={closeDeleteDialog}
          onConfirm={handleDeleteAccount}
          userEmail={userEmail}
        />
      )}
      <ConfirmationDialog
        isOpen={isSignOutDialogRequested}
        title="Sair da conta?"
        description="Você precisará entrar novamente para acessar sua biblioteca neste dispositivo."
        eyebrow="Encerrar sessão"
        confirmLabel="Sair"
        confirmIcon={<LogOut size={14} />}
        onCancel={() => setIsSignOutDialogRequested(false)}
        onConfirm={() => void onSignOut()}
      />
    </div>
  );
}

function SettingsMobileTopBar({ userEmail }: { userEmail: string }) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountInitial = userEmail.trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAccountMenuOpen]);

  return (
    <div className="flex items-center justify-between md:hidden">
      <NavLink to="/" aria-label="Voltar para a biblioteca" className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-noir-champagne"><ArrowLeft size={20} /></NavLink>
      <div ref={accountMenuRef} className="relative">
        <button type="button" onClick={() => setIsAccountMenuOpen((current) => !current)} aria-label="Abrir opções da conta" aria-expanded={isAccountMenuOpen} title={userEmail} className="flex h-10 w-10 items-center justify-center rounded-full border border-noir-gold/30 bg-noir-gold/10 text-sm font-bold text-noir-champagne transition hover:border-noir-gold hover:bg-noir-gold/20">{accountInitial || <UserRound size={18} />}</button>
        {isAccountMenuOpen && (
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e] p-2 shadow-2xl shadow-black/60">
            <div className="border-b border-white/5 px-3 pb-3 pt-2"><p className="truncate text-sm font-bold text-white">{userEmail}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-neutral-500">Configurações</p></div>
            <nav className="mt-2 flex flex-col gap-1" aria-label="Opções da conta">
              {settingsLinks.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setIsAccountMenuOpen(false)} className={({ isActive }) => `flex h-10 items-center gap-3 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wide transition ${isActive ? 'bg-noir-gold/10 text-noir-champagne' : 'text-neutral-500 hover:bg-white/[0.04] hover:text-white'}`}>{link.icon}<span>{link.label}</span></NavLink>)}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationSettings({ session }: { session: SettingsScreenProps['session'] }) {
  const [permission, setPermission] = useState<"checking" | "unsupported" | "prompt" | "prompt-with-rationale" | "granted" | "denied">("checking");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getPushPermissionState()
      .then((state) => {
        if (isMounted) setPermission(state);
      })
      .catch(() => {
        if (isMounted) setPermission("denied");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isGranted = permission === "granted";
  const permissionLabel = permission === "checking"
    ? "Verificando no Android"
    : permission === "unsupported"
      ? "Disponível no aplicativo Android"
      : isGranted
        ? "Ativadas no Android"
        : "Desativadas no Android";
  const permissionDescription = isGranted
    ? "O Horizon pode enviar lembretes da biblioteca, avisos de sincronização e atualizações."
    : "As permissões são pedidas na primeira abertura do aplicativo Android e podem ser alteradas nas configurações do sistema.";

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestMessage(null);

    try {
      await sendPushNotificationTest(session);
      setTestMessage("Notificação enviada para este dispositivo.");
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : "Não foi possível enviar a notificação de teste.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]">
      <div className="flex items-center justify-between gap-5 px-6 py-5">
        <div>
          <h2 className="text-sm font-bold text-white">Avisos da biblioteca</h2>
          <p className="mt-1 max-w-xl text-sm leading-5 text-neutral-500">{permissionDescription}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${isGranted ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-neutral-400'}`}>{permissionLabel}</span>
      </div>
      <div className="grid gap-px border-t border-white/5 bg-white/5 sm:grid-cols-2">
        {[
          ['Biblioteca', 'Lembrete semanal para obras em andamento.'],
          ['Sincronização', 'Alterações offline e problemas que precisem da sua atenção.'],
          ['Atualizações', 'Novas versões disponíveis do Horizon.'],
          ['Conta', 'Avisos importantes relacionados ao seu acesso.'],
        ].map(([label, description]) => (
          <div key={label} className="bg-[#1a1a1e] px-6 py-4">
            <p className="text-xs font-bold text-neutral-200">{label}</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 px-6 py-4">
        <p className={`text-xs ${testMessage?.startsWith('Notificação enviada') ? 'text-emerald-200' : 'text-neutral-500'}`} aria-live="polite">
          {testMessage ?? 'Use o teste para confirmar a configuração deste aparelho.'}
        </p>
        <button
          type="button"
          disabled={!isGranted || isSendingTest}
          onClick={() => void handleSendTest()}
          className="flex h-10 items-center justify-center rounded-lg border border-noir-gold/35 bg-noir-gold/10 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-noir-champagne transition hover:bg-noir-gold/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isSendingTest ? 'Enviando...' : 'Enviar teste'}
        </button>
      </div>
    </section>
  );
}

function PlanSettings() {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]">
      <div className="border-b border-white/5 px-6 py-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-noir-gold">Plano atual</p>
        <h2 className="mt-3 font-serif text-3xl font-extrabold text-noir-champagne">Horizon pessoal</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">Sua biblioteca está ativa e vinculada a esta conta. Quando houver planos pagos, as opções e o histórico aparecerão aqui.</p>
      </div>
      <div className="px-6 py-5 text-sm text-neutral-500">Nenhuma cobrança ou assinatura ativa.</div>
    </section>
  );
}

function AccountSettings({ onOpenDelete, onRequestSignOut, userEmail }: AccountSettingsProps) {
  return (
    <>
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e]">
        <SettingsRow label="E-mail" description="Endereço usado para acessar sua conta." value={userEmail} />
        <SettingsRow
          label="Sessão"
          description="Encerre o acesso neste dispositivo."
          action={(
            <button
              type="button"
              onClick={onRequestSignOut}
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
      <NavLink to="/" aria-label="Voltar para a página inicial" className="flex w-fit items-center gap-2">
        <span className="font-serif text-[31px] font-extrabold italic leading-none text-noir-champagne lowercase">
          horizon<span className="text-noir-gold">.</span>
        </span>
        <span className="mt-1 rounded border border-noir-gold/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-noir-gold/70">Noir</span>
      </NavLink>

      <nav className="mt-[66px] flex flex-col gap-[14px]" aria-label="Configurações">
        <span className="mb-1 ml-4 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">Configurações</span>
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
  errorMessage,
  isDeleting,
  onCancel,
  onConfirm,
  userEmail,
}: DeleteAccountDialogProps) {
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const isEmailConfirmed = emailConfirmation.trim().toLowerCase() === userEmail.trim().toLowerCase();
  const canDelete = isEmailConfirmed && Boolean(password);

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
          <p className="text-sm leading-6 text-neutral-300">Você está prestes a excluir a conta <strong className="font-semibold text-white">{userEmail}</strong>. Esta ação não pode ser desfeita.</p>
          <label className="mt-5 flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Digite seu e-mail para confirmar</span>
            <input type="email" value={emailConfirmation} onChange={(event) => setEmailConfirmation(event.target.value)} autoComplete="off" className="h-11 rounded-lg border border-white/10 bg-[#101012] px-4 text-sm outline-none focus:border-red-300/50" />
          </label>

          <label className="mt-4 flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Senha atual</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-11 rounded-lg border border-white/10 bg-[#101012] px-4 text-sm outline-none focus:border-red-300/50" />
          </label>

          {errorMessage && <p className="mt-4 rounded-lg border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{errorMessage}</p>}
        </div>

        <footer className="flex gap-3 border-t border-white/10 bg-black/10 p-5">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 font-mono text-xs font-bold uppercase tracking-wide text-neutral-300 disabled:opacity-60">Cancelar</button>
          <button type="button" onClick={() => onConfirm(emailConfirmation, password)} disabled={isDeleting || !canDelete} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-4 font-mono text-xs font-bold uppercase tracking-wide text-red-200 disabled:opacity-40"><Trash2 size={16} />{isDeleting ? 'Excluindo' : 'Excluir'}</button>
        </footer>
      </section>
    </div>
  );
}
