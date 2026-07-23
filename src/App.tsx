import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuthSession } from './hooks/useAuthSession'
import { useMfaAssurance } from './hooks/useMfaAssurance'
import type { InitialScreenProps } from './screens/initialScreen/types'
import { ConnectionStatus } from './components/ConnectionStatus'
import { AppSplash } from './components/AppSplash'
import { AppUpdateDialog } from './components/AppUpdateDialog'
import { initializePushNotifications, unregisterPushNotifications } from './services/pushNotificationService'

const AuthScreen = lazy(() => import('./screens/authScreen').then((module) => ({ default: module.AuthScreen })))
const InitialScreen = lazy(() => import('./screens/initialScreen/index.tsx').then((module) => ({ default: module.InitialScreen })))
const SettingsScreen = lazy(() => import('./screens/settingsScreen').then((module) => ({ default: module.SettingsScreen })))
const ResetPasswordScreen = lazy(() => import('./screens/resetPasswordScreen').then((module) => ({ default: module.ResetPasswordScreen })))
const MfaChallengeScreen = lazy(() => import('./screens/mfaChallengeScreen').then((module) => ({ default: module.MfaChallengeScreen })))
const SteamAutoSync = lazy(() => import('./components/SteamAutoSync').then((module) => ({ default: module.SteamAutoSync })))

function CustomLibraryRoute({ userEmail }: { userEmail?: string }) {
  const { categorySlug = "" } = useParams();

  return <InitialScreen activeTab="custom" customCategorySlug={categorySlug} userEmail={userEmail} />;
}

function DossierRoute({ userEmail }: { userEmail?: string }) {
  const { mediaId = "" } = useParams();

  return <InitialScreen activeTab="overview" dossierMediaId={mediaId} userEmail={userEmail} />;
}

function App() {
  const { isLoadingSession, session, signOut } = useAuthSession()
  const { isCheckingMfa, isMfaRequired, resetMfaCheck } = useMfaAssurance(session)
  const [isSplashVisible, setIsSplashVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsSplashVisible(false), 800)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (isSplashVisible || isLoadingSession || isCheckingMfa || !session) return;

    void initializePushNotifications(session).catch((error) => {
      console.warn("Não foi possível inicializar as notificações.", error);
    });
  }, [isCheckingMfa, isLoadingSession, isSplashVisible, session]);

  if (isSplashVisible || isLoadingSession || isCheckingMfa) return <AppSplash />

  const isAuthenticated = Boolean(session)
  const handleSignOut = async () => {
    if (session) {
      await unregisterPushNotifications(session).catch((error) => {
        console.warn("Não foi possível remover o dispositivo das notificações.", error);
      });
    }
    await signOut()
  }
  const renderLibraryRoute = (activeTab: InitialScreenProps['activeTab']) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />
    }

    return <InitialScreen activeTab={activeTab} userEmail={session?.user.email} />
  }

  if (isAuthenticated && isMfaRequired) {
    return (
      <MfaChallengeScreen
        onVerified={resetMfaCheck}
      />
    )
  }

  return (
    <>
      {session && <Suspense fallback={null}><SteamAutoSync session={session} /></Suspense>}
      <ConnectionStatus />
      <AppUpdateDialog />
      <Suspense fallback={<AppSplash />}>
        <Routes>
          <Route
            path="/auth"
            element={isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />}
          />
          <Route
            path="/auth/callback"
            element={isAuthenticated ? <Navigate to="/" replace /> : <AuthScreen />}
          />
          <Route
            path="/auth/reset-password"
            element={<ResetPasswordScreen isAuthenticated={isAuthenticated} />}
          />
          <Route path="/" element={renderLibraryRoute("overview")} />
          <Route path="/animes" element={renderLibraryRoute("animes")} />
          <Route path="/movies" element={renderLibraryRoute("movies")} />
          <Route path="/games" element={renderLibraryRoute("games")} />
          <Route path="/books" element={renderLibraryRoute("books")} />
          <Route path="/dossier/:mediaId" element={isAuthenticated ? <DossierRoute userEmail={session?.user.email} /> : <Navigate to="/auth" replace />} />
          <Route path="/c/:categorySlug" element={isAuthenticated ? <CustomLibraryRoute userEmail={session?.user.email} /> : <Navigate to="/auth" replace />} />
          <Route
            path="/settings"
            element={isAuthenticated && session ? <SettingsScreen onSignOut={handleSignOut} session={session} /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/settings/*"
            element={isAuthenticated && session ? <SettingsScreen onSignOut={handleSignOut} session={session} /> : <Navigate to="/auth" replace />}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
