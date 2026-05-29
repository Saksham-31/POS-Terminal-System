import React, { useState, useEffect } from 'react'
import { FiSearch, FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiMail, FiCheckCircle, FiChevronRight, FiTag, FiDollarSign } from 'react-icons/fi'
import confetti from 'canvas-confetti'

export default function POS({ user, triggerNotification }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [customerEmail, setCustomerEmail] = useState('')
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products/user/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        triggerNotification('Failed to fetch store inventory', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerNotification('Inventory loading failed. Ensure the server is online.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [user.id])

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      triggerNotification(`${product.name} is currently out of stock!`, 'error')
      return
    }

    const existingIndex = cart.findIndex(item => item.id === product.id)
    if (existingIndex !== -1) {
      const updatedCart = [...cart]
      if (updatedCart[existingIndex].qty >= product.quantity) {
        triggerNotification(`Cannot add more. Only ${product.quantity} units in stock.`, 'error')
        return
      }
      updatedCart[existingIndex].qty += 1
      setCart(updatedCart)
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  const updateCartQty = (productId, change) => {
    const product = products.find(p => p.id === productId)
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        const newQty = item.qty + change
        if (newQty <= 0) return null
        if (newQty > product.quantity) {
          triggerNotification(`Only ${product.quantity} units are available in inventory`, 'error')
          return item
        }
        return { ...item, qty: newQty }
      }
      return item
    }).filter(Boolean)
    
    setCart(updatedCart)
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  }

  const calculateTax = () => {
    // 18% GST standard representation
    return calculateSubtotal() * 0.18
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      triggerNotification('Your checkout cart is empty', 'error')
      return
    }

    setCheckingOut(true)
    
    // Format payload to match backend Bill DTO
    const billItems = cart.map(item => ({
      productName: item.name,
      quantity: item.qty,
      price: item.price
    }))

    const payload = {
      customerEmail: customerEmail.trim() || null,
      items: billItems,
      totalAmount: calculateSubtotal() // Backend calculates total over items
    }

    try {
      const response = await fetch(`/api/bills/generate/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const generatedBill = await response.json()
        setReceipt(generatedBill)
        setCheckoutSuccess(true)
        setCart([])
        setCustomerEmail('')
        
        // Trigger celebration confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        })
        
        triggerNotification('Bill generated successfully! Digital invoice sent.', 'success')
        fetchProducts() // Refresh catalog stock levels
      } else {
        const errMsg = await response.text()
        triggerNotification(errMsg || 'Checkout transaction failed', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerNotification('Connection failed during checkout process', 'error')
    } finally {
      setCheckingOut(false)
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
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Booting checkout registers...</p>
      </div>
    )
  }

  if (checkoutSuccess && receipt) {
    return (
      <div className="animate-fade-in" style={styles.successContainer}>
        <div className="glass-panel" style={styles.successCard}>
          <div style={styles.successHeader}>
            <FiCheckCircle size={56} color="#10b981" />
            <h2 style={styles.successTitle}>Transaction Complete!</h2>
            <p style={styles.successSubtitle}>Digital Invoice sent to: {receipt.customerEmail || 'Walk-in Customer'}</p>
          </div>

          <div style={styles.receiptSummary}>
            <h4 style={styles.receiptHeader}>Receipt Summary #{receipt.id}</h4>
            <div style={styles.receiptList}>
              {receipt.items.map((item, idx) => (
                <div key={idx} style={styles.receiptItem}>
                  <span>{item.productName} (x{item.quantity})</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={styles.receiptDivider}></div>
            <div style={styles.receiptTotal}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{receipt.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setCheckoutSuccess(false)}>
            New Checkout Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.layout}>
        {/* Left Side: Product Picker */}
        <div style={styles.catalogColumn}>
          <div style={styles.pickerHeader}>
            <div>
              <h1 style={styles.title}>POS Terminal</h1>
              <p style={styles.subtitle}>Select products, build a cart, and invoice clients.</p>
            </div>
            {/* Elegant Search bar */}
            <div style={styles.searchWrapper} className="glass-panel">
              <FiSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search catalog or scan barcode..."
                style={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={styles.emptyCatalog} className="glass-panel">
              <FiTag size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                {search ? 'No products match search criteria' : 'Add products in Inventory to start billing'}
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredProducts.map((p) => {
                const outOfStock = p.quantity <= 0
                return (
                  <div
                    key={p.id}
                    className="glass-panel glass-panel-interactive"
                    style={{ ...styles.productCard, opacity: outOfStock ? 0.6 : 1 }}
                    onClick={() => addToCart(p)}
                  >
                    <div style={styles.prodDetails}>
                      <span style={styles.prodName}>{p.name}</span>
                      <span style={styles.prodBarcode}>Barcode: {p.barcode || 'N/A'}</span>
                    </div>
                    <div style={styles.prodBottom}>
                      <span style={styles.prodPrice}>₹{p.price.toFixed(2)}</span>
                      <span className={`badge ${outOfStock ? 'badge-low-stock' : p.quantity < 5 ? 'badge-low-stock' : 'badge-in-stock'}`}>
                        {outOfStock ? 'Sold Out' : `${p.quantity} units`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Checkout Cart Sidebar */}
        <div style={styles.cartColumn} className="glass-panel">
          <div style={styles.cartHeader}>
            <FiShoppingCart size={22} style={{ color: 'var(--color-primary)' }} />
            <h3 style={styles.cartTitle}>Billing Cart</h3>
            {cart.length > 0 && (
              <span className="badge badge-in-stock">{cart.reduce((s, i) => s + i.qty, 0)} items</span>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <FiShoppingCart size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Cart is empty</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>Select catalog products on the left to start billing.</p>
            </div>
          ) : (
            <>
              {/* Cart List */}
              <div style={styles.cartList}>
                {cart.map((item) => (
                  <div key={item.id} style={styles.cartItem} className="animate-slide-in">
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={styles.cartItemName}>{item.name}</span>
                      <span style={styles.cartItemPrice}>₹{item.price.toFixed(2)} each</span>
                    </div>
                    <div style={styles.cartItemQtyControls}>
                      <button style={styles.qtyBtn} onClick={() => updateCartQty(item.id, -1)}>
                        <FiMinus size={12} />
                      </button>
                      <span style={styles.qtyCount}>{item.qty}</span>
                      <button style={styles.qtyBtn} onClick={() => updateCartQty(item.id, 1)}>
                        <FiPlus size={12} />
                      </button>
                    </div>
                    <button style={styles.trashBtn} onClick={() => removeFromCart(item.id)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={styles.breakdown}>
                <div style={styles.breakdownRow}>
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div style={styles.breakdownRow}>
                  <span>Estimated GST (18%)</span>
                  <span>₹{calculateTax().toFixed(2)}</span>
                </div>
                <div style={styles.receiptDivider}></div>
                <div style={{ ...styles.breakdownRow, fontSize: '1.1rem', fontWeight: '700' }}>
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Invoicing Details Form */}
              <form onSubmit={handleCheckout} style={styles.checkoutForm}>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label>Customer Email (Sends e-receipt)</label>
                  <div style={styles.emailWrapper}>
                    <FiMail style={styles.emailIcon} />
                    <input
                      type="email"
                      placeholder="customer@email.com"
                      className="input-field"
                      style={styles.emailInput}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      disabled={checkingOut}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={styles.checkoutBtn} disabled={checkingOut}>
                  {checkingOut ? 'Processing Checkout...' : 'Generate Bill & Checkout'}
                  <FiChevronRight size={18} />
                </button>
              </form>
            </>
          )}
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
    height: 'calc(100vh - 100px)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '7fr 4fr',
    gap: '24px',
    height: '100%',
  },
  catalogColumn: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    height: '100%',
    paddingRight: '4px',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '20px',
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
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 16px',
    width: '320px',
  },
  searchIcon: {
    color: 'var(--text-muted)',
    marginRight: '10px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '100%',
    padding: '10px 0',
  },
  emptyCatalog: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  productCard: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '130px',
  },
  prodDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  prodName: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '1rem',
  },
  prodBarcode: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  prodBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
  },
  prodPrice: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  cartColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '24px',
    overflowY: 'auto',
  },
  cartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-card)',
    paddingBottom: '14px',
  },
  cartTitle: {
    fontSize: '1.15rem',
    flex: 1,
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    padding: '40px 20px',
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px',
    marginBottom: '20px',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.02)',
    border: '1px solid var(--border-card)',
    gap: '10px',
  },
  cartItemName: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  cartItemPrice: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  cartItemQtyControls: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '6px',
    padding: '2px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
  },
  qtyCount: {
    fontSize: '0.8rem',
    fontWeight: '600',
    minWidth: '20px',
    textAlign: 'center',
  },
  trashBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    outline: 'none',
  },
  breakdown: {
    background: 'rgba(0,0,0,0.02)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    border: '1px solid var(--border-card)',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  receiptDivider: {
    height: '1px',
    background: 'var(--border-card)',
    margin: '10px 0',
  },
  checkoutForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  emailWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  emailIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  emailInput: {
    width: '100%',
    paddingLeft: '38px',
  },
  checkoutBtn: {
    width: '100%',
    padding: '14px',
  },
  successContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)',
    width: '100%',
  },
  successCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px',
    textAlign: 'center',
    borderRadius: '24px',
  },
  successHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
  },
  successTitle: {
    fontSize: '1.6rem',
    marginTop: '16px',
  },
  successSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    marginTop: '4px',
  },
  receiptSummary: {
    background: 'rgba(0, 0, 0, 0.02)',
    border: '1.5px dashed var(--border-card)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'left',
  },
  receiptHeader: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  receiptList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  receiptItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  receiptTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: '700',
    fontSize: '1.1rem',
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
