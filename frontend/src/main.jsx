import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/custom-bootstrap.css'
import './styles/index.css'
import './shared/components/modal-popups.css'
import './styles/motion-system.css'
import App from './app/App.jsx'
import { AlertProvider } from './shared/context/AlertContext.jsx'
import { ConfirmProvider } from './shared/context/ConfirmContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfirmProvider>
    </AlertProvider>
  </StrictMode>,
)






