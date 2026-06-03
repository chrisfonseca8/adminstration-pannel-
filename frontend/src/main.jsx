import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId =  "269960511180-sehv0t0laj6q899gjbvutsukmunmdr5t.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(

  <GoogleOAuthProvider clientId={clientId}>
    <StrictMode>
      <App />
    </StrictMode>
  </GoogleOAuthProvider>
)
