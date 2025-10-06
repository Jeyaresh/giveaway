import { useState } from 'react'
import { X, CreditCard, Loader, CheckCircle, Download } from 'lucide-react'
import { openRazorpayCheckout } from '../utils/razorpayCheckout'

function PaymentPopup({ isOpen, onClose, product, onPaymentSuccess, onPaymentError, onPaymentClose }) {
  const [participantName, setParticipantName] = useState('')
  const [participantEmail, setParticipantEmail] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const ebookPrice = 10 // ₹10 for ebook

  const handlePaymentInitiation = (e) => {
    e.preventDefault()
    
    if (!participantName.trim() || !participantEmail.trim()) {
      setPaymentError('Please fill in all fields')
      return
    }

    // Prepare customer data
    const customerData = {
      id: Date.now(),
      name: participantName,
      email: participantEmail,
      amount: ebookPrice
    }

    // Direct Razorpay payment - open checkout immediately
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
    
    setIsPaid(true)
    setIsPaymentProcessing(false)
    setPaymentError('')
    setShowDownloadModal(true)

    // Reset form
    setParticipantName('')
    setParticipantEmail('')

    // Call parent success handler
    if (onPaymentSuccess) {
      onPaymentSuccess(response, customerData)
    }
  }

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
    setPaymentError(error || 'Payment failed. Please try again.')
    setIsPaymentProcessing(false)
    
    if (onPaymentError) {
      onPaymentError(error)
    }
  }

  const handlePaymentClose = () => {
    setIsPaymentProcessing(false)
    setPaymentError('')
    
    if (onPaymentClose) {
      onPaymentClose()
    }
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

  const handleClose = () => {
    if (!isPaymentProcessing) {
      resetPayment()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="payment-popup-overlay">
      <div className="payment-popup">
        <div className="payment-popup-header">
          <h2>Buy {product?.name || 'Product'}</h2>
          <button 
            className="payment-popup-close"
            onClick={handleClose}
            disabled={isPaymentProcessing}
            aria-label="Close popup"
          >
            <X size={24} />
          </button>
        </div>

        <div className="payment-popup-content">
          {!isPaid ? (
            <form onSubmit={handlePaymentInitiation} className="payment-form">
              <div className="product-info">
                <h3>Granzia - ₹{ebookPrice}</h3>
                <p>Complete your purchase to get instant access to the ebook and enter the iPhone giveaway!</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="popup-name">Full Name</label>
                <input
                  type="text"
                  id="popup-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={isPaymentProcessing}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="popup-email">Email</label>
                <input
                  type="email"
                  id="popup-email"
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
        </div>
      </div>
    </div>
  )
}

export default PaymentPopup
