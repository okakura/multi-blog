import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import BlogPlatform from './App'
import { DomainProvider } from './contexts/DomainContext'
import { SWRProvider } from './providers/SWRProvider'

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <SWRProvider>
        <DomainProvider>
          <BrowserRouter>
            <BlogPlatform />
          </BrowserRouter>
        </DomainProvider>
      </SWRProvider>
    </React.StrictMode>
  )
}
