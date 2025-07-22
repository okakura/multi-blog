import React from 'react'
let ReactDOM: typeof import('react-dom/client');
if (process.env.NODE_ENV === 'development' && process.env.PROFILING === 'true') {
  // Use profiling build only in dev profiling mode
  ReactDOM = require('react-dom/profiling');
} else {
  ReactDOM = require('react-dom/client');
}
import { BrowserRouter } from 'react-router-dom'
import BlogPlatform from './App'
import { SWRProvider } from './providers/SWRProvider'

// Enable React DevTools and Profiler in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Expose React for DevTools detection
  (window as any).React = React;
  // For React 18+/19+, also expose ReactDOM
  (window as any).ReactDOM = ReactDOM;
  // If DevTools hook exists, enable profiler
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.inject &&
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
          React,
          ReactDOM,
        });
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.settings = {
        ...((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.settings || {}),
        profilerEnabled: true,
      };
    } catch (e) {
      // Ignore errors
    }
  }
}

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <SWRProvider>
        <BrowserRouter>
          <BlogPlatform />
        </BrowserRouter>
      </SWRProvider>
    </React.StrictMode>
  )
}
