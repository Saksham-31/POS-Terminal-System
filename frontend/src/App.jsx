import React, { useState, useEffect } from 'react'
import { FiLayout, FiShoppingCart, FiPackage, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Inventory from './components/Inventory'
import POS from './components/POS'

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load User Session and Theme on startup
  useEffect(() => {
    const cachedUser = localStorage.getItem('pos_user')
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser))
      } catch (e) {
        console.error('Failed to parse cached user', e)
      }
    }

    const cachedTheme = localStorage.getItem('pos_theme') || 'light'
    setTheme(cachedTheme)
    document.documentElement.setAttribute('data-theme', cachedTheme)
  }, [])

  // Theme Toggler
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('pos_theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    triggerNotification(`Switched to ${nextTheme} theme`, 'success')
  }

  // Toast Notification Trigger
  const triggerNotification = (message, type = 'success') => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    
    // Auto-remove notification after 3.5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3500)
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    localStorage.setItem('pos_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('pos_user')
    triggerNotification('Logged out successfully', 'success')
  }

  if (!user) {
    return (
      <>
        {/* Absolute Top Level Notifications */}
        <div className="notification-container">
          {notifications.map((n) => (
            <div key={n.id} className={`toast ${n.type === 'success' ? 'toast-success' : 'toast-error'}`}>
              {n.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
              <span>{n.message}</span>
            </div>
          ))}
        </div>
        <Auth onLoginSuccess={handleLoginSuccess} triggerNotification={triggerNotification} />
      </>
    )
  }

  return (
    <div style={styles.appContainer}>
      {/* Toast Notifications */}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`toast ${n.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {n.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
            <span>{n.message}</span>
          </div>
        ))}
      </div>

      {/* Modern Sidebar Navigation */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <div className="shop-brand">
            <FiShoppingCart size={24} />
            <span>Retail Hub</span>
          </div>
          <span style={styles.shopSubTitle}>{user.shopName}</span>
        </div>

        <nav style={styles.nav}>
          <button
            style={{ ...styles.navLink, ...(tab === 'dashboard' ? styles.activeNavLink : {}) }}
            onClick={() => { setTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <FiLayout size={18} />
            <span>Dashboard</span>
          </button>

          <button
            style={{ ...styles.navLink, ...(tab === 'pos' ? styles.activeNavLink : {}) }}
            onClick={() => { setTab('pos'); setMobileMenuOpen(false); }}
          >
            <FiShoppingCart size={18} />
            <span>POS Billing</span>
          </button>

          <button
            style={{ ...styles.navLink, ...(tab === 'inventory' ? styles.activeNavLink : {}) }}
            onClick={() => { setTab('inventory'); setMobileMenuOpen(false); }}
          >
            <FiPackage size={18} />
            <span>Inventory</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          {/* Theme Switcher in sidebar */}
          <button style={styles.themeToggle} onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {theme === 'light' ? (
              <>
                <FiMoon size={16} /> <span>Dark Theme</span>
              </>
            ) : (
              <>
                <FiSun size={16} /> <span>Light Theme</span>
              </>
            )}
          </button>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            <FiLogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content" style={styles.main}>
        {tab === 'dashboard' && (
          <Dashboard user={user} setTab={setTab} triggerNotification={triggerNotification} />
        )}
        {tab === 'pos' && (
          <POS user={user} triggerNotification={triggerNotification} />
        )}
        {tab === 'inventory' && (
          <Inventory user={user} triggerNotification={triggerNotification} />
        )}
      </main>
    </div>
  )
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
  },
  sidebar: {
    width: '260px',
    borderRadius: '0px 24px 24px 0px',
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 20px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'var(--bg-card)',
  },
  sidebarHeader: {
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-card)',
  },
  shopSubTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginTop: '6px',
    display: 'block',
    paddingLeft: '4px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: 'var(--font-display)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left',
    width: '100%',
    transition: 'all var(--transition-fast)',
    outline: 'none',
  },
  activeNavLink: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
  sidebarFooter: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '1px solid var(--border-card)',
    paddingTop: '20px',
  },
  themeToggle: {
    background: 'rgba(0, 0, 0, 0.02)',
    border: '1.5px solid var(--border-card)',
    color: 'var(--text-secondary)',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background var(--transition-fast)',
    outline: 'none',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left',
    width: '100%',
    transition: 'background var(--transition-fast)',
    outline: 'none',
  },
  main: {
    flex: 1,
    height: '100vh',
    overflowY: 'auto',
  },
}
