import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { announceUpdateAvailable } from './app/updateToastStore'
import './index.css'
import App from './App.tsx'

const updateSW = registerSW({
  onNeedRefresh() {
    announceUpdateAvailable(updateSW)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
