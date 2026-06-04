import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import { logoSrc } from './components/Logo.jsx'

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.href = logoSrc
  favicon.type = 'image/png'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ duration: 3500 }}
      />
    </BrowserRouter>
  </StrictMode>,
)
