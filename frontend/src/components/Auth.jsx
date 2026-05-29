import React, { useState } from 'react'
import { FiMail, FiLock, FiShoppingBag, FiArrowRight, FiUserCheck, FiLogIn } from 'react-icons/fi'

export default function Auth({ onLoginSuccess, triggerNotification }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || (!isLogin && !shopName)) {
      triggerNotification('Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
    const body = isLogin ? { email, password } : { email, password, shopName }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (isLogin) {
        const text = await response.text()
        try {
          const user = JSON.parse(text)
          if (user && user.id) {
            triggerNotification(`Welcome back to ${user.shopName || 'POS'}!`, 'success')
            onLoginSuccess(user)
          } else {
            triggerNotification('Invalid login details', 'error')
          }
        } catch {
          // If response is not JSON, it's a string like "Invalid Credentials"
          triggerNotification(text || 'Invalid Credentials', 'error')
        }
      } else {
        const text = await response.text()
        if (response.ok) {
          triggerNotification('Shop registered successfully! Logging in...', 'success')
          // Auto login after signup
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const loginText = await loginResponse.text()
          const user = JSON.parse(loginText)
          if (user && user.id) {
            onLoginSuccess(user)
          }
        } else {
          triggerNotification(text || 'Failed to sign up', 'error')
        }
      }
    } catch (err) {
      console.error(err)
      triggerNotification('Unable to connect to the POS server. Please ensure the backend is running.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Decorative Orbs for Glassmorphism depth */}
      <div style={{ ...styles.orb, ...styles.orb1 }} className="animate-float"></div>
      <div style={{ ...styles.orb, ...styles.orb2 }} className="animate-float"></div>

      <div style={styles.authCard} className="glass-panel animate-fade-in">
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <FiShoppingBag size={28} color="white" />
          </div>
          <h2 style={styles.title}>{isLogin ? 'Access Retail Hub' : 'Register Your Shop'}</h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Enter your credentials to manage your store' : 'Set up your digital POS terminal in seconds'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div className="input-group">
              <label>Shop / Outlet Name</label>
              <div style={styles.inputWrapper}>
                <FiShoppingBag style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. Bansal Electronics"
                  className="input-field"
                  style={styles.input}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div style={styles.inputWrapper}>
              <FiMail style={styles.inputIcon} />
              <input
                type="email"
                placeholder="you@example.com"
                className="input-field"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label>Password</label>
            <div style={styles.inputWrapper}>
              <FiLock style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Shop'}
            {isLogin ? <FiLogIn size={18} /> : <FiUserCheck size={18} />}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>
            {isLogin ? "New to Retail Hub?" : "Already have an account?"}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={styles.toggleBtn}
            disabled={loading}
          >
            {isLogin ? 'Create an account' : 'Sign in here'}
            <FiArrowRight size={14} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    zIndex: 1,
    opacity: 0.4,
  },
  orb1: {
    width: '350px',
    height: '350px',
    background: 'hsl(var(--hue-primary), 85%, 60%)',
    top: '15%',
    left: '15%',
  },
  orb2: {
    width: '300px',
    height: '300px',
    background: 'hsl(var(--hue-secondary), 85%, 60%)',
    bottom: '15%',
    right: '15%',
    animationDelay: '-3s',
  },
  authCard: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    borderRadius: '24px',
    zIndex: 2,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
  },
  title: {
    fontSize: '1.6rem',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    paddingLeft: '46px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    marginTop: '8px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '28px',
    fontSize: '0.85rem',
  },
  footerText: {
    color: 'var(--text-secondary)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    outline: 'none',
    transition: 'color var(--transition-fast)',
  },
}
