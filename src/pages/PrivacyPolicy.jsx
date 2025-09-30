import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Home, BarChart3, Shield, Eye, Lock, FileText, Mail, Phone, MapPin, ArrowLeft, Menu, X } from 'lucide-react'
import BackToTop from '../components/BackToTop'
import './PrivacyPolicy.css'

function PrivacyPolicy() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="privacy-page">
      {/* Navigation Header */}
      <header className="header-nav">
        <div className="header-container">
          <div className="header-brand">
            <BookOpen className="brand-icon" />
            <span className="brand-text">Digital Success Guide</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="header-nav-desktop">
            <Link to="/" className="nav-link">
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link to="/transparency" className="nav-link">
              <BarChart3 size={18} />
              <span>Transparency Report</span>
            </Link>
            <Link to="/privacy" className="nav-link active">
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
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link 
                to="/transparency" 
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 size={20} />
                <span>Transparency Report</span>
              </Link>
              <Link 
                to="/privacy" 
                className="mobile-nav-link active"
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

      {/* Main Content */}
      <main className="privacy-main">
        <div className="privacy-container">
          {/* Back Button */}
          <Link to="/" className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="privacy-header">
            <div className="privacy-icon">
              <Shield size={48} />
            </div>
            <h1>Privacy Policy</h1>
            <p className="privacy-subtitle">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <div className="privacy-date">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Content Sections */}
          <div className="privacy-content">
            <section className="privacy-section">
              <h2>
                <Eye size={24} />
                Information We Collect
              </h2>
              <div className="privacy-card">
                <h3>Personal Information</h3>
                <ul>
                  <li><strong>Name:</strong> Required for order processing and giveaway participation</li>
                  <li><strong>Email Address:</strong> Used for order confirmation, ebook delivery, and communication</li>
                  <li><strong>Phone Number:</strong> Optional, used for order updates and customer support</li>
                  <li><strong>Payment Information:</strong> Processed securely through Razorpay (we don't store payment details)</li>
                </ul>
              </div>
            </section>

            <section className="privacy-section">
              <h2>
                <Lock size={24} />
                How We Use Your Information
              </h2>
              <div className="privacy-card">
                <h3>Primary Uses</h3>
                <ul>
                  <li>Process your ebook purchase and payment</li>
                  <li>Deliver your digital ebook download</li>
                  <li>Register you for the iPhone giveaway</li>
                  <li>Send order confirmations and receipts</li>
                  <li>Provide customer support</li>
                  <li>Maintain transparency records for the giveaway</li>
                </ul>
              </div>
            </section>

            <section className="privacy-section">
              <h2>
                <Shield size={24} />
                Data Security
              </h2>
              <div className="privacy-card">
                <h3>Security Measures</h3>
                <ul>
                  <li>All data transmission is encrypted using SSL/TLS</li>
                  <li>Payment processing handled by Razorpay (PCI DSS compliant)</li>
                  <li>Data stored in secure Firebase databases</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication systems</li>
                </ul>
              </div>
            </section>

            <section className="privacy-section">
              <h2>
                <FileText size={24} />
                Data Sharing
              </h2>
              <div className="privacy-card">
                <h3>We Do Not Share Your Data</h3>
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except:</p>
                <ul>
                  <li>Payment processors (Razorpay) for transaction processing</li>
                  <li>Legal requirements or court orders</li>
                  <li>Protection of our rights and safety</li>
                </ul>
              </div>
            </section>

            <section className="privacy-section">
              <h2>
                <Mail size={24} />
                Communication
              </h2>
              <div className="privacy-card">
                <h3>Email Communications</h3>
                <ul>
                  <li>Order confirmations and receipts</li>
                  <li>Ebook download instructions</li>
                  <li>Giveaway updates and results</li>
                  <li>Customer support responses</li>
                  <li>You can unsubscribe from promotional emails at any time</li>
                </ul>
              </div>
            </section>

            <section className="privacy-section">
              <h2>
                <MapPin size={24} />
                Your Rights
              </h2>
              <div className="privacy-card">
                <h3>Data Protection Rights</h3>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct your information</li>
                  <li><strong>Deletion:</strong> Request deletion of your data</li>
                  <li><strong>Portability:</strong> Export your data in a readable format</li>
                  <li><strong>Objection:</strong> Object to certain data processing</li>
                </ul>
              </div>
            </section>

            <section className="privacy-section">
              <h2>
                <Phone size={24} />
                Contact Us
              </h2>
              <div className="privacy-card">
                <h3>Privacy Questions</h3>
                <p>If you have any questions about this Privacy Policy or your data:</p>
                <div className="contact-info">
                  <div className="contact-item">
                    <Mail size={20} />
                    <span>privacy@digitalsuccessguide.com</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={20} />
                    <span>+91-XXXX-XXXX-XX</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="privacy-section">
              <h2>Policy Updates</h2>
              <div className="privacy-card">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <BackToTop />
    </div>
  )
}

export default PrivacyPolicy
