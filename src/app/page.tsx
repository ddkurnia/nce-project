'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Load CSS files
    const cssFiles = [
      '/assets/css/variables.css',
      '/assets/css/base.css',
      '/assets/css/components.css',
      '/assets/css/overlay.css',
      '/assets/css/views.css',
      '/assets/css/views-detail.css',
      '/assets/css/navigation.css',
    ]

    cssFiles.forEach(href => {
      if (document.querySelector(`link[href="${href}"]`)) return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    })

    // Load Inter font
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
      const fontLink = document.createElement('link')
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
      fontLink.rel = 'stylesheet'
      document.head.appendChild(fontLink)
    }

    // Load the SPA app module
    if (!document.querySelector('script[data-nce-app]')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = '/assets/js/app.js'
      script.setAttribute('data-nce-app', 'true')
      document.body.appendChild(script)
    }

    // Register service worker
    if ('serviceWorker' in navigator && !window.__swRegistered) {
      window.__swRegistered = true
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <div id="nce-spa" style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#081120',
      color: '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header id="main-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 40,
        backdropFilter: 'blur(12px)',
      }} />

      {/* Main Content */}
      <main id="app" style={{
        paddingTop: 56,
        paddingBottom: 64,
        flex: 1,
      }} />

      {/* Bottom Navigation */}
      <nav id="bottom-nav" role="navigation" aria-label="Navigasi utama" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(212, 175, 55, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
      }} />
    </div>
  )
}

declare global {
  interface Window {
    __swRegistered?: boolean
  }
}
