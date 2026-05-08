import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Disabling StrictMode temporarily to prevent MediaPipe WASM initialization conflicts.
// MediaPipe's underlying loader often fails when double-mounted by React 18.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
