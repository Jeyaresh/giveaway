import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Home, ShoppingBag, BarChart3, Shield, Menu, X } from 'lucide-react'

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="header-nav">
      <div className="header-container">
        <div className="header-brand">
          <BookOpen className="brand-icon" />
          <span className="brand-text">Digital Success Guide</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="header-nav-desktop">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
            <ShoppingBag size={18} />
            <span>Products</span>
          </Link>
          <Link to="/transparency" className={`nav-link ${isActive('/transparency') ? 'active' : ''}`}>
            <BarChart3 size={18} />
            <span>Transparency Report</span>
          </Link>
          <Link to="/privacy" className={`nav-link ${isActive('/privacy') ? 'active' : ''}`}>
            <Shield size={18} />
            <span>Privacy Policy</span>
          </Link>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookOpen className="sidebar-brand-icon" />
              <span className="sidebar-brand-text">Digital Success Guide</span>
            </div>
            <button 
              className="mobile-sidebar-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close mobile menu"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="mobile-nav">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link 
              to="/products" 
              className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingBag size={20} />
              <span>Products</span>
            </Link>
            <Link 
              to="/transparency" 
              className={`mobile-nav-link ${isActive('/transparency') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BarChart3 size={20} />
              <span>Transparency Report</span>
            </Link>
            <Link 
              to="/privacy" 
              className={`mobile-nav-link ${isActive('/privacy') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Shield size={20} />
              <span>Privacy Policy</span>
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}

export default Header
