import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider'
import { NativeAuthRedirect } from './components/NativeAuthRedirect'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <NativeAuthRedirect />
        <App />
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
