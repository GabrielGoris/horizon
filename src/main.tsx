import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider'
import { NativeAuthRedirect } from './components/NativeAuthRedirect'
import { NativeBackNavigation } from './components/NativeBackNavigation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <NativeAuthRedirect />
        <NativeBackNavigation />
        <App />
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
