import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthScreen } from './screens/authScreen'
import { InitialScreen } from './screens/initialScreen/index.tsx'
import { useAuthSession } from './hooks/useAuthSession'
import { useMfaAssurance } from './hooks/useMfaAssurance'
import { supabase } from './lib/supabase'
import type { InitialScreenProps } from './screens/initialScreen/types'
import { SettingsScreen } from './screens/settingsScreen'
import { ResetPasswordScreen } from './screens/resetPasswordScreen'
import { MfaChallengeScreen } from './screens/mfaChallengeScreen'
import { SteamAutoSync } from './components/SteamAutoSync'

function CustomLibraryRoute() {
  const { categorySlug = "" } = useParams();

  return <InitialScreen activeTab="custom" customCategorySlug={categorySlug} />;
}

function App() {
  const { isLoadingSession, session } = useAuthSession()
  const { isCheckingMfa, isMfaRequired, resetMfaCheck } = useMfaAssurance(session)

  if (isLoadingSession || isCheckingMfa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noir-base text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="font-serif text-[34px] font-extrabold italic leading-none text-noir-champagne lowercase">
            horizon<span className="text-noir-gold">.</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            Carregando sessão
          </span>
        </div>
      </div>
    )
  }

  const isAuthenticated = Boolean(session)
  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
  }
  const renderLibraryRoute = (activeTab: InitialScreenProps['activeTab']) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />
    }

    return <InitialScreen activeTab={activeTab} />
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
      {session && <SteamAutoSync session={session} />}
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
      <Route path="/c/:categorySlug" element={isAuthenticated ? <CustomLibraryRoute /> : <Navigate to="/auth" replace />} />
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
    </>
  )
}

export default App
