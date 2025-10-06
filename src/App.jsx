import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { BookOpen, Users, Target, CheckCircle, Gift, CreditCard, Loader, Download } from 'lucide-react'
import ParticipantsList from './components/ParticipantsList'
import TransparencyReport from './pages/TransparencyReport'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ProductsPage from './pages/ProductsPage'
import BackToTop from './components/BackToTop'
import Header from './components/Header'
import { openRazorpayCheckout } from './utils/razorpayCheckout'
import './App.css'

// Main Ebook Sales Page Component
function EbookSalesPage() {
  const [participants, setParticipants] = useState([])
  const [totalCollected, setTotalCollected] = useState(0)
  const [participantName, setParticipantName] = useState('')
  const [participantEmail, setParticipantEmail] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [currentParticipantData, setCurrentParticipantData] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const targetAmount = 100000 // ₹1 lakh
  const ebookPrice = 10 // ₹10 for ebook
  const giveawayPrize = 80000 // ₹80,000 iPhone

  // Function to fetch real-time data from Firebase
  const fetchFirebaseData = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      
      // Import Firebase service functions
      const { getAllParticipants, getPaymentStats } = await import('./services/firebaseService');
      
      const [participants, stats] = await Promise.all([
        getAllParticipants(),
        getPaymentStats()
      ]);

      // Filter only completed participants
      const completedParticipants = participants.filter(p => p.paymentStatus === 'completed');
      
      setParticipants(completedParticipants);
      setTotalCollected(stats.totalCollected);
      
      console.log('Firebase data loaded:', {
        participants: completedParticipants.length,
        totalCollected: stats.totalCollected
      });
    } catch (error) {
      console.error('Error fetching Firebase data:', error);
      // No fallback needed - Firebase is the single source of truth
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch initial data from Firebase
    fetchFirebaseData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchFirebaseData, 30000);
    
    return () => clearInterval(interval);
  }, [])

  const handlePaymentInitiation = (e) => {
    e.preventDefault()
    
    if (!participantName.trim() || !participantEmail.trim()) {
      setPaymentError('Please fill in all fields')
      return
    }

    // Check if email already exists (this will be double-checked by the backend)
    // The backend will handle the actual duplicate check against Firebase

    // Prepare customer data
    const customerData = {
      id: Date.now(),
      name: participantName,
      email: participantEmail,
      amount: ebookPrice
    }

    // Direct Razorpay payment - open checkout immediately
    setCurrentParticipantData(customerData)
    setIsPaymentProcessing(true)
    setPaymentError('')
    
    // Open Razorpay checkout directly with all payment methods
    openRazorpayCheckout(
      ebookPrice,
      customerData,
      handlePaymentSuccess,
      handlePaymentError,
      handlePaymentClose
    )
  }

  const handlePaymentSuccess = async (response, customerData) => {
    console.log('Payment successful:', response)
    
    // Refresh data from Firebase to get the latest statistics
    await fetchFirebaseData()
    
    setIsPaid(true)
    setIsPaymentProcessing(false)
    setPaymentError('')
    setShowDownloadModal(true)

    // Reset form
    setParticipantName('')
    setParticipantEmail('')
    setCurrentParticipantData(null)
  }

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
    setPaymentError(error || 'Payment failed. Please try again.')
    setIsPaymentProcessing(false)
  }

  const handlePaymentClose = () => {
    setIsPaymentProcessing(false)
    setPaymentError('')
  }

  const resetPayment = () => {
    setIsPaid(false)
    setShowDownloadModal(false)
  }

  const downloadEbook = () => {
    // In a real implementation, this would download the actual ebook file
    // For now, we'll show a success message
    alert('Ebook download started! Check your email for the download link.')
    setShowDownloadModal(false)
  }

  // Data security: No clear data functionality - all data is permanently stored for transparency

  const isTargetReached = totalCollected >= targetAmount
  const progressPercentage = Math.min((totalCollected / targetAmount) * 100, 100)
  
  // Debug logging only when values change
  useEffect(() => {
    console.log('Progress Updated:', {
      totalCollected,
      targetAmount,
      participants: participants.length,
      progressPercentage: progressPercentage.toFixed(2)
    });
  }, [totalCollected, participants.length, progressPercentage]);

  return (
    <div className="app">
      {/* Navigation Header */}
      <Header />

      {/* Main Header Content */}
      <header className="header">
        <h1>📚 Digital Success Guide</h1>
        <p>Buy our premium ebook for ₹10 and get a chance to win an iPhone worth ₹80,000!</p>
      </header>

      <main className="main">
        {/* Product Display */}
        <div className="product-card">
          <div className="product-image">
            <BookOpen size={120} />
          </div>
          <div className="product-details">
            <h2>Digital Success Guide</h2>
            <p className="product-value">Premium Ebook - ₹{ebookPrice}</p>
            <p className="product-description">
              A comprehensive guide to digital success, packed with actionable insights and strategies. 
              Plus, every purchase makes you eligible for our iPhone giveaway!
            </p>
            <div className="ebook-features">
              <h4>What's Inside:</h4>
              <ul>
                <li>✅ 50+ pages of expert content</li>
                <li>✅ Practical strategies and tips</li>
                <li>✅ Real-world case studies</li>
                <li>✅ Instant download after purchase</li>
                <li>✅ Lifetime access to updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-header">
            <div className="refresh-stats">
              <button 
                onClick={() => fetchFirebaseData(true)}
                disabled={isRefreshing}
                className="refresh-button"
                title="Refresh data from Firebase"
              >
                {isRefreshing ? <Loader className="spinner" /> : '🔄'} 
                {isRefreshing ? ' Refreshing...' : ' Refresh'}
              </button>
            </div>
            <div className="progress-stat">
              <Target className="stat-icon" />
              <div>
                <span className="stat-value">₹{totalCollected.toLocaleString()}</span>
                <span className="stat-label">Total Sales</span>
              </div>
            </div>
            <div className="progress-stat">
              <Users className="stat-icon" />
              <div>
                <span className="stat-value">{participants.length}</span>
                <span className="stat-label">Customers</span>
              </div>
            </div>
            <div className="progress-stat">
              <Gift className="stat-icon" />
              <div>
                <span className="stat-value">₹{targetAmount.toLocaleString()}</span>
                <span className="stat-label">Giveaway Target</span>
              </div>
            </div>
          </div>

          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
      </div>
          <p className="progress-text">
            <strong>{progressPercentage.toFixed(1)}% towards giveaway target</strong>
            <br />
            <small>₹{totalCollected.toLocaleString()} of ₹{targetAmount.toLocaleString()} ({participants.length} customers)</small>
            {isTargetReached && (
              <span className="target-reached">
                <CheckCircle size={16} />
                Giveaway Target Reached!
              </span>
            )}
          </p>
      </div>

        {/* Legal Compliance Notice */}
        <div className="legal-notice">
          <div className="legal-badge">
            <span className="legal-icon">⚖️</span>
            <span>Legal & Transparent</span>
          </div>
          <div className="legal-info">
            <p>✅ You are purchasing a digital product (ebook)</p>
            <p>✅ Giveaway entry is a bonus benefit with purchase</p>
            <p>✅ All transactions are recorded and transparent</p>
            <p>✅ Winner selection will be random and fair</p>
          </div>
        </div>

        {/* Payment Form */}
        {!isTargetReached && (
          <div className="payment-section">
            {!isPaid ? (
              <form onSubmit={handlePaymentInitiation} className="payment-form">
                <h3>Buy Ebook - ₹{ebookPrice}</h3>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    disabled={isPaymentProcessing}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isPaymentProcessing}
                  />
                </div>
                {paymentError && (
                  <div className="error-message">
                    {paymentError}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="pay-button"
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? (
                    <>
                      <Loader className="spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Buy Ebook for ₹{ebookPrice}
                    </>
                  )}
                </button>
                <div className="payment-methods">
                  <p>Payment Methods: Google Pay, PhonePe, Paytm, BHIM & Other UPI Apps</p>
                </div>
              </form>
            ) : (
              <div className="payment-success">
                <CheckCircle size={48} className="success-icon" />
                <h3>Purchase Successful!</h3>
                <p>You have successfully purchased the ebook and are now eligible for the giveaway.</p>
                <button onClick={resetPayment} className="reset-button">
                  Buy Another Copy
                </button>
              </div>
            )}
          </div>
        )}


        {/* Download Modal */}
        {showDownloadModal && (
          <div className="download-modal">
            <div className="download-content">
              <h3>🎉 Purchase Complete!</h3>
              <p>Your ebook is ready for download. You're also now eligible for our iPhone giveaway!</p>
              <button onClick={downloadEbook} className="download-button">
                <Download size={20} />
                Download Ebook
              </button>
              <button onClick={() => setShowDownloadModal(false)} className="close-download">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Customers Section */}
        <div className="participants-section">
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className="toggle-participants"
          >
            {showParticipants ? 'Hide' : 'Show'} Customers ({participants.length})
          </button>
          
          {showParticipants && <ParticipantsList />}
        </div>

        {/* Terms and Conditions */}
        <div className="rules-section">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>You are purchasing a digital ebook for ₹10</li>
            <li>Giveaway entry is a bonus benefit with your purchase</li>
            <li>Each customer can purchase only once</li>
            <li>Giveaway target is ₹{targetAmount.toLocaleString()}</li>
            <li>Once target is reached, winner will be randomly selected</li>
            <li>Winner will be contacted via email</li>
            <li>iPhone will be delivered within 7-10 business days</li>
            <li>Ebook will be delivered immediately after payment</li>
            <li>All sales are final - no refunds</li>
          </ul>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Digital Success Guide. All rights reserved.</p>
        <div className="privacy-links">
          <button
            onClick={() => window.open('/#/transparency', '_blank')}
            className="privacy-link"
          >
            📊 Transparency Report
          </button>
          <Link 
            to="/privacy" 
            className="privacy-link"
          >
            🔒 Privacy Policy
          </Link>
        </div>
      </footer>
      
      <BackToTop />
    </div>
  )
}

// Main App Component with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EbookSalesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/transparency" element={<TransparencyReport />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  )
}

export default App