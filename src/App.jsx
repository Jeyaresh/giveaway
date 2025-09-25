import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Smartphone, Users, Target, CheckCircle, Gift, CreditCard, Loader } from 'lucide-react'
import RazorpayPayment from './components/RazorpayPayment'
import ParticipantsList from './components/ParticipantsList'
import TransparencyReport from './pages/TransparencyReport'
import './App.css'

// Main Giveaway Page Component
function GiveawayPage() {
  const [participants, setParticipants] = useState([])
  const [totalCollected, setTotalCollected] = useState(0)
  const [participantName, setParticipantName] = useState('')
  const [participantEmail, setParticipantEmail] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentParticipantData, setCurrentParticipantData] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const targetAmount = 100000 // ₹1 lakh
  const entryFee = 10 // ₹10 per entry
  const productValue = 80000 // ₹80,000 iPhone

  // Function to fetch real-time data from Firebase
  const fetchFirebaseData = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      
      const [statsResponse, participantsResponse] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/participants')
      ]);

      if (statsResponse.ok && participantsResponse.ok) {
        const statsData = await statsResponse.json();
        const participantsData = await participantsResponse.json();

        if (statsData.success) {
          setTotalCollected(statsData.stats.totalCollected);
        }

        if (participantsData.success) {
          setParticipants(participantsData.participants);
        }
      }
    } catch (error) {
      console.error('Error fetching Firebase data:', error);
      // Fallback to localStorage if Firebase fails
      const savedParticipants = localStorage.getItem('giveawayParticipants');
      if (savedParticipants) {
        const parsed = JSON.parse(savedParticipants);
        setParticipants(parsed);
        setTotalCollected(parsed.length * entryFee);
      }
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

    // Prepare participant data
    const participantData = {
      id: Date.now(),
      name: participantName,
      email: participantEmail,
      amount: entryFee
    }

    // Real payment mode with Razorpay
    setCurrentParticipantData(participantData)
    setIsPaymentProcessing(true)
    setPaymentError('')
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (response, participantData) => {
    console.log('Payment successful:', response)
    
    // Refresh data from Firebase to get the latest statistics
    await fetchFirebaseData()
    
    setIsPaid(true)
    setIsPaymentProcessing(false)
    setShowPaymentModal(false)
    setPaymentError('')

    // Reset form
    setParticipantName('')
    setParticipantEmail('')
    setCurrentParticipantData(null)
  }

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
    setPaymentError('Payment failed. Please try again.')
    setIsPaymentProcessing(false)
    setShowPaymentModal(false)
  }

  const handlePaymentClose = () => {
    setIsPaymentProcessing(false)
    setShowPaymentModal(false)
    setPaymentError('Payment cancelled by user')
  }

  const resetPayment = () => {
    setIsPaid(false)
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
      <header className="header">
        <h1>🎉 iPhone Giveaway</h1>
        <p>Win an iPhone worth ₹80,000 for just ₹10!</p>
      </header>

      <main className="main">
        {/* Product Display */}
        <div className="product-card">
          <div className="product-image">
            <Smartphone size={120} />
          </div>
          <div className="product-details">
            <h2>iPhone 15 Pro</h2>
            <p className="product-value">Worth ₹{productValue.toLocaleString()}</p>
            <p className="product-description">
              Brand new iPhone 15 Pro with latest features and premium build quality.
            </p>
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
                <span className="stat-label">Collected</span>
              </div>
            </div>
            <div className="progress-stat">
              <Users className="stat-icon" />
              <div>
                <span className="stat-value">{participants.length}</span>
                <span className="stat-label">Participants</span>
              </div>
            </div>
            <div className="progress-stat">
              <Gift className="stat-icon" />
      <div>
                <span className="stat-value">₹{targetAmount.toLocaleString()}</span>
                <span className="stat-label">Target</span>
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
            <strong>{progressPercentage.toFixed(1)}% complete</strong>
            <br />
            <small>₹{totalCollected.toLocaleString()} of ₹{targetAmount.toLocaleString()} ({participants.length} participants)</small>
            {isTargetReached && (
              <span className="target-reached">
                <CheckCircle size={16} />
                Target Reached!
              </span>
            )}
        </p>
      </div>

        {/* Data Security & Transparency Notice */}
        {participants.length > 0 && (
          <div className="data-security-notice">
            <div className="security-badge">
              <span className="security-icon">🔒</span>
              <span>All data is securely stored and transparent</span>
            </div>
            <div className="transparency-info">
              <p>✅ Data is encrypted and stored securely</p>
              <p>✅ All transactions are permanently recorded for transparency</p>
              <p>✅ No data can be deleted to maintain integrity</p>
              <p>✅ All payments are verified and auditable</p>
            </div>
            <div className="transparency-actions">
              <button
                onClick={() => window.open('/transparency', '_blank')}
                className="transparency-button"
              >
                📊 View Full Transparency Report
              </button>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {!isTargetReached && (
          <div className="payment-section">
            {!isPaid ? (
              <form onSubmit={handlePaymentInitiation} className="payment-form">
                <h3>Enter Giveaway - ₹{entryFee}</h3>
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
                      Pay ₹{entryFee} & Enter Giveaway
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
                <h3>Payment Successful!</h3>
                <p>You have successfully entered the giveaway.</p>
                <button onClick={resetPayment} className="reset-button">
                  Enter Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Razorpay Payment Modal */}
        {showPaymentModal && currentParticipantData && (
          <RazorpayPayment
            amount={entryFee}
            participantData={currentParticipantData}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onClose={handlePaymentClose}
          />
        )}

        {/* Participants Section */}
        <div className="participants-section">
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className="toggle-participants"
          >
            {showParticipants ? 'Hide' : 'Show'} Participants ({participants.length})
          </button>
          
          {showParticipants && <ParticipantsList />}
        </div>

        {/* Rules Section */}
        <div className="rules-section">
          <h3>Giveaway Rules</h3>
          <ul>
            <li>Each participant can pay ₹10 only once</li>
            <li>Total target is ₹{targetAmount.toLocaleString()}</li>
            <li>Once target is reached, winner will be randomly selected</li>
            <li>Winner will be contacted via email</li>
            <li>Product will be delivered within 7-10 business days</li>
          </ul>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 iPhone Giveaway. All rights reserved.</p>
        <div className="privacy-links">
          <button
            onClick={() => window.open('/transparency', '_blank')}
            className="privacy-link"
          >
            📊 Transparency Report
          </button>
          <button 
            onClick={() => alert('Privacy Policy: All data is encrypted, securely stored, and permanently retained for transparency. No data can be deleted to maintain integrity.')}
            className="privacy-link"
          >
            🔒 Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  )
}

// Main App Component with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GiveawayPage />} />
        <Route path="/transparency" element={<TransparencyReport />} />
      </Routes>
    </Router>
  )
}

export default App