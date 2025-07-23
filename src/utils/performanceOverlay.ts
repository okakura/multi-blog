// Performance overlay utilities

/**
 * Show the performance overlay
 */
export const showPerformanceOverlay = () => {
  localStorage.setItem('show_performance_overlay', 'true')
  window.location.reload()
}

/**
 * Hide the performance overlay
 */
export const hidePerformanceOverlay = () => {
  localStorage.removeItem('show_performance_overlay')
  window.location.reload()
}

/**
 * Toggle the performance overlay
 */
export const togglePerformanceOverlay = () => {
  const isShown = localStorage.getItem('show_performance_overlay') === 'true'
  if (isShown) {
    hidePerformanceOverlay()
  } else {
    showPerformanceOverlay()
  }
}

/**
 * Check if performance overlay is enabled
 */
export const isPerformanceOverlayEnabled = () => {
  // Only show in development by default
  // Can be manually enabled in production via localStorage
  return process.env.NODE_ENV === 'development' || 
         localStorage.getItem('show_performance_overlay') === 'true'
}

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).performance_overlay = {
    show: showPerformanceOverlay,
    hide: hidePerformanceOverlay,
    toggle: togglePerformanceOverlay,
    enabled: isPerformanceOverlayEnabled
  }
}
