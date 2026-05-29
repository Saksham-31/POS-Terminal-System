import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiSearch, FiPackage, FiGrid, FiEye, FiCheck, FiX, FiTag } from 'react-icons/fi'

export default function Inventory({ user, triggerNotification }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products/user/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        triggerNotification('Failed to fetch product catalog', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerNotification('Could not load products. Backend offline?', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [user.id])

  const openAddForm = () => {
    setEditingId(null)
    setName('')
    setBarcode('')
    setPrice('')
    setQuantity('')
    setShowForm(true)
  }

  const openEditForm = (product) => {
    setEditingId(product.id)
    setName(product.name)
    setBarcode(product.barcode || '')
    setPrice(product.price.toString())
    setQuantity(product.quantity.toString())
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name || !price || !quantity) {
      triggerNotification('Please fill in all required fields', 'error')
      return
    }

    if (parseFloat(price) <= 0 || parseInt(quantity) < 0) {
      triggerNotification('Price must be positive, and stock quantity cannot be negative', 'error')
      return
    }

    setSaving(true)
    const payload = {
      name,
      barcode: barcode.trim() || null,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    }

    try {
      let response
      if (editingId) {
        // Edit flow
        response = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // Add flow
        response = await fetch(`/api/products/user/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        triggerNotification(
          editingId ? 'Product details updated!' : 'Product added to inventory!',
          'success'
        )
        setShowForm(false)
        fetchProducts()
      } else {
        const errText = await response.text()
        triggerNotification(errText || 'An error occurred during submission', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerNotification('Connection error while saving', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  )

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Cataloging products...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Inventory Management</h1>
          <p style={styles.subtitle}>Audit, restock, and catalog your store's products.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <FiPlus size={18} /> Add New Product
        </button>
      </div>

      {/* Glass Search Bar */}
      <div style={styles.searchRow} className="glass-panel">
        <FiSearch style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Filter inventory by name or barcode number..."
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={styles.clearSearch} onClick={() => setSearch('')}>
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Catalog Table */}
      <div className="glass-panel" style={styles.tableCard}>
        {filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <FiPackage size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {search ? 'No products match your search query' : 'Your retail catalog is currently empty'}
            </p>
            {!search && (
              <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={openAddForm}>
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableTh}>Product Name</th>
                  <th style={styles.tableTh}>Barcode</th>
                  <th style={styles.tableTh}>Price</th>
                  <th style={styles.tableTh}>Current Stock</th>
                  <th style={styles.tableTh}>Status</th>
                  <th style={styles.tableTh} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isLow = p.quantity < 5
                  return (
                    <tr key={p.id} style={styles.tableRow}>
                      <td style={styles.tableTd}>
                        <div style={styles.nameColumn}>
                          <FiTag style={{ color: 'var(--color-primary)', marginRight: '8px' }} />
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td style={styles.tableTd}>
                        <span style={styles.barcodeLabel}>{p.barcode || '—'}</span>
                      </td>
                      <td style={styles.tableTd} style={{ fontWeight: '600' }}>
                        ₹{p.price.toFixed(2)}
                      </td>
                      <td style={styles.tableTd}>
                        <strong>{p.quantity} units</strong>
                      </td>
                      <td style={styles.tableTd}>
                        <span className={`badge ${isLow ? 'badge-low-stock' : 'badge-in-stock'}`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={styles.tableTd} style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={styles.editBtn}
                          onClick={() => openEditForm(p)}
                          title="Edit Details"
                        >
                          <FiEdit2 size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Glass Modal Form */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel animate-fade-in" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingId ? 'Edit Product Details' : 'Add Catalog Product'}
              </h3>
              <button style={styles.modalClose} onClick={() => setShowForm(false)}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={styles.form}>
              <div className="input-group">
                <label>Product Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Mechanical Keyboard"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="input-group">
                <label>Barcode / UPC (Optional)</label>
                <input
                  type="text"
                  placeholder="Scan or enter unique serial number"
                  className="input-field"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div style={styles.formRow}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Unit Price (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2499.00"
                    className="input-field"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <label>In-Stock Quantity <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    placeholder="25"
                    className="input-field"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Details...' : editingId ? 'Update Product' : 'Add to Catalog'}
                  <FiCheck size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    marginTop: '4px',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 16px',
    marginBottom: '24px',
    position: 'relative',
  },
  searchIcon: {
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
    marginRight: '12px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    padding: '12px 0',
  },
  clearSearch: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    outline: 'none',
  },
  tableCard: {
    padding: '20px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
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
    padding: '12px 16px',
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
    padding: '16px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  nameColumn: {
    display: 'flex',
    alignItems: 'center',
  },
  barcodeLabel: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    background: 'rgba(0,0,0,0.03)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  editBtn: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    borderRadius: '6px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: '500px',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '1.25rem',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    outline: 'none',
    transition: 'color var(--transition-fast)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
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
