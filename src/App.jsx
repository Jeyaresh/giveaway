import { useState, useEffect } from 'react'
import { Smartphone, Users, Target, CheckCircle, Gift, CreditCard, Loader } from 'lucide-react'
import UPIPayment from './components/UPIPayment'
import './App.css'

function App() {
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
  const [testMode, setTestMode] = useState(false) // Disable test mode by default

  const targetAmount = 100000 // ₹1 lakh
  const entryFee = 10 // ₹10 per entry
  const productValue = 80000 // ₹80,000 iPhone

  useEffect(() => {
    // Load saved data from localStorage
    const savedParticipants = localStorage.getItem('giveawayParticipants')
    if (savedParticipants) {
      const parsed = JSON.parse(savedParticipants)
      setParticipants(parsed)
      setTotalCollected(parsed.length * entryFee)
    }
  }, [])

  const handlePaymentInitiation = (e) => {
    e.preventDefault()
    
    if (!participantName.trim() || !participantEmail.trim()) {
      setPaymentError('Please fill in all fields')
      return
    }

    // Check if email already exists
    if (participants.some(p => p.email === participantEmail)) {
      setPaymentError('This email has already participated!')
      return
    }

    // Prepare participant data
    const participantData = {
      id: Date.now(),
      name: participantName,
      email: participantEmail,
      amount: entryFee
    }

    if (testMode) {
      // Test mode - simulate successful payment immediately
      setIsPaymentProcessing(true)
      setPaymentError('')
      
      // Simulate payment processing delay
      setTimeout(() => {
        const mockPaymentResponse = {
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_order_id: `order_test_${Date.now()}`,
          razorpay_signature: `sig_test_${Date.now()}`
        }
        handlePaymentSuccess(mockPaymentResponse, participantData)
      }, 1500) // 1.5 second delay to simulate processing
    } else {
      // Real payment mode
      setCurrentParticipantData(participantData)
      setIsPaymentProcessing(true)
      setPaymentError('')
      setShowPaymentModal(true)
    }
  }

  const handlePaymentSuccess = (response, participantData) => {
    console.log('Payment successful:', response)
    
    const newParticipant = {
      ...participantData,
      paymentDate: new Date().toLocaleString(),
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature
    }

    const updatedParticipants = [...participants, newParticipant]
    const newTotalCollected = updatedParticipants.length * entryFee
    
    console.log('Updated participants:', updatedParticipants.length)
    console.log('New total collected:', newTotalCollected)
    
    setParticipants(updatedParticipants)
    setTotalCollected(newTotalCollected)
    setIsPaid(true)
    setIsPaymentProcessing(false)
    setShowPaymentModal(false)
    setPaymentError('')
    
    // Save to localStorage
    localStorage.setItem('giveawayParticipants', JSON.stringify(updatedParticipants))

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

  const clearAllData = () => {
    setParticipants([])
    setTotalCollected(0)
    setIsPaid(false)
    localStorage.removeItem('giveawayParticipants')
    console.log('All data cleared')
  }

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

        {/* Clear Data Button */}
        {participants.length > 0 && (
          <div className="clear-data-section">
            <button onClick={clearAllData} className="clear-data-button">
              🗑️ Clear All Data
            </button>
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

        {/* UPI Payment Modal */}
        {showPaymentModal && currentParticipantData && (
          <UPIPayment
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
          
          {showParticipants && (
            <div className="participants-list">
              {participants.length === 0 ? (
                <p>No participants yet. Be the first to enter!</p>
              ) : (
                <div className="participants-grid">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="participant-card">
                      <div className="participant-number">#{index + 1}</div>
                      <div className="participant-info">
                        <h4>{participant.name}</h4>
                        <p>{participant.email}</p>
                        <small>{participant.paymentDate}</small>
                        {participant.razorpayPaymentId && (
                          <small className="payment-id">
                            Payment ID: {participant.razorpayPaymentId.slice(-8)}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
      </footer>
    </div>
  )
}

export default App