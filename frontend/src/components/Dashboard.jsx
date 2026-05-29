import React, { useState, useEffect } from 'react'
import { FiDollarSign, FiTrendingUp, FiShoppingBag, FiAlertTriangle, FiArrowRight, FiFileText, FiClock } from 'react-icons/fi'

export default function Dashboard({ user, setTab, triggerNotification }) {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0 })
  const [recentBills, setRecentBills] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats (Revenue and Orders)
      const statsRes = await fetch(`/api/bills/stats/${user.id}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // 2. Fetch Recent Bills
      const billsRes = await fetch(`/api/bills/user/${user.id}`)
      if (billsRes.ok) {
        const billsData = await billsRes.json()
        setRecentBills(billsData.slice(0, 5)) // Get latest 5 bills
      }

      // 3. Fetch Products for Low Stock warning (qty < 5)
      const productsRes = await fetch(`/api/products/user/${user.id}`)
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        const lowStock = productsData.filter(p => p.quantity < 5)
        setLowStockCount(lowStock.length)
        setLowStockProducts(lowStock.slice(0, 4))
      }
    } catch (err) {
      console.error(err)
      triggerNotification('Failed to reload dashboard stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user.id])

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Gathering store performance...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={styles.greeting}>Welcome, {user.shopName}!</h1>
          <p style={styles.subGreeting}>Here is what's happening at your retail outlet today.</p>
        </div>
        <div style={styles.dateBadge} className="glass-panel">
          <FiClock style={{ marginRight: '6px' }} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="dashboard-grid">
        <div className="glass-panel metric-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <span className="metric-label">Total Revenue</span>
            <div style={{ ...styles.iconCircle, background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
              <FiDollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={styles.cardTrend}>
            <FiTrendingUp style={{ marginRight: '4px' }} />
            <span>Live store sales</span>
          </div>
        </div>

        <div className="glass-panel metric-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <span className="metric-label">Bills Generated</span>
            <div style={{ ...styles.iconCircle, background: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-primary)' }}>
              <FiFileText size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.totalOrders}</div>
          <div style={styles.cardTrend}>
            <span>Completed checkouts</span>
          </div>
        </div>

        <div className="glass-panel metric-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <span className="metric-label">Low Stock Alert</span>
            <div style={{
              ...styles.iconCircle,
              background: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              color: lowStockCount > 0 ? '#ef4444' : '#22c55e'
            }}>
              <FiAlertTriangle size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ color: lowStockCount > 0 ? '#ef4444' : 'inherit' }}>
            {lowStockCount}
          </div>
          <div style={styles.cardTrend}>
            <span>{lowStockCount > 0 ? 'Action required immediately' : 'All items fully stocked'}</span>
          </div>
        </div>
      </div>

      {/* Main content Split */}
      <div style={styles.layoutSplit}>
        {/* Left Side: Recent Sales / Bills */}
        <div style={styles.leftCol} className="glass-panel">
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Recent Invoices</h3>
            <button style={styles.headerAction} onClick={() => setTab('pos')}>
              New Invoice <FiArrowRight size={14} />
            </button>
          </div>

          {recentBills.length === 0 ? (
            <div style={styles.emptyState}>
              <FiShoppingBag size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No invoices generated yet</p>
              <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={() => setTab('pos')}>
                Launch Terminal
              </button>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableTh}>Bill ID</th>
                    <th style={styles.tableTh}>Customer Email</th>
                    <th style={styles.tableTh}>Created At</th>
                    <th style={styles.tableTh} style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((bill) => (
                    <tr key={bill.id} style={styles.tableRow}>
                      <td style={styles.tableTd}><strong>#{bill.id}</strong></td>
                      <td style={styles.tableTd}>{bill.customerEmail || 'Walk-in Customer'}</td>
                      <td style={styles.tableTd}>
                        {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={styles.tableTd} style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-primary)' }}>
                        ₹{bill.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Proactive Stock Warnings & Quick Actions */}
        <div style={styles.rightCol}>
          {/* Quick Actions Panel */}
          <div style={styles.quickActionsCard} className="glass-panel">
            <h3 style={styles.sectionTitle} style={{ marginBottom: '16px' }}>Terminal Shortcuts</h3>
            <div style={styles.actionGrid}>
              <button style={{ ...styles.actionBtn, background: 'linear-gradient(135deg, var(--color-primary) 0%, hsl(var(--hue-primary), 80%, 65%) 100%)' }} onClick={() => setTab('pos')}>
                <span style={styles.actionBtnLabel}>Launch POS Billing</span>
                <span style={styles.actionBtnSub}>Checkout Customers</span>
              </button>
              <button style={{ ...styles.actionBtn, background: 'linear-gradient(135deg, var(--color-secondary) 0%, hsl(var(--hue-secondary), 80%, 70%) 100%)' }} onClick={() => setTab('inventory')}>
                <span style={styles.actionBtnLabel}>Inventory Panel</span>
                <span style={styles.actionBtnSub}>Add/Update Products</span>
              </button>
            </div>
          </div>

          {/* Low Stock Watchlist */}
          <div style={styles.watchlistCard} className="glass-panel">
            <h3 style={styles.sectionTitle} style={{ marginBottom: '12px' }}>Low Stock Watchlist</h3>
            {lowStockProducts.length === 0 ? (
              <div style={styles.watchlistEmpty}>
                <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: '500' }}>✓ All inventory levels normal</span>
              </div>
            ) : (
              <div style={styles.watchlistGrid}>
                {lowStockProducts.map(p => (
                  <div key={p.id} style={styles.watchlistItem}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={styles.watchlistName}>{p.name}</span>
                      <span style={styles.watchlistBarcode}>Barcode: {p.barcode || 'N/A'}</span>
                    </div>
                    <div style={styles.watchlistRight}>
                      <span className="badge badge-low-stock">{p.quantity} left</span>
                    </div>
                  </div>
                ))}
                {lowStockCount > 4 && (
                  <button style={styles.viewMoreLink} onClick={() => setTab('inventory')}>
                    View all {lowStockCount} items
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  greeting: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
  },
  subGreeting: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    marginTop: '4px',
  },
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTrend: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  layoutSplit: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    marginTop: '10px',
  },
  leftCol: {
    padding: '28px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
  },
  headerAction: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    outline: 'none',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1.5px solid var(--border-card)',
  },
  tableTh: {
    padding: '12px 8px',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-card)',
    transition: 'background var(--transition-fast)',
  },
  tableTd: {
    padding: '16px 8px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  quickActionsCard: {
    padding: '24px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  actionBtn: {
    border: 'none',
    borderRadius: '12px',
    padding: '18px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    transition: 'transform var(--transition-fast), filter var(--transition-fast)',
    outline: 'none',
  },
  actionBtn: {
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    transition: 'transform var(--transition-fast), filter var(--transition-fast)',
    outline: 'none',
  },
  actionBtnLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
  },
  actionBtnSub: {
    fontSize: '0.75rem',
    opacity: 0.85,
    marginTop: '4px',
  },
  watchlistCard: {
    padding: '24px',
  },
  watchlistEmpty: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0',
  },
  watchlistGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  watchlistItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(0, 0, 0, 0.02)',
    border: '1px solid var(--border-card)',
  },
  watchlistName: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  watchlistBarcode: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  viewMoreLink: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'center',
    marginTop: '8px',
    outline: 'none',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    width: '100%',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid var(--border-card)',
    borderTopColor: 'var(--color-primary)',
    animation: 'spin 1s linear infinite',
  },
}

// Keyframes declaration natively handled in index.css
