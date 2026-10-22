import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
// Rounded display font for the HUD, buttons and loading screen (bundled, no CDN).
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
