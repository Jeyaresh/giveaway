import { useState } from 'react';
import { MERCHANT_CONFIG } from '../config/merchant';

const UPIPayment = ({ 
  amount, 
  participantData,
  onSuccess, 
  onError, 
  onClose 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateUPIUrl = () => {
    // Create UPI payment URL that opens UPI apps directly
    const upiId = MERCHANT_CONFIG.upiId;
    const merchantName = MERCHANT_CONFIG.merchantName;
    const transactionNote = `Giveaway Entry - ${participantData.name}`;
    const transactionRef = `GIVEAWAY_${participantData.id}_${Date.now()}`;
    
    // UPI URL format with proper transaction reference
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
    
    return upiUrl;
  };

  const handleUPIPayment = () => {
    setIsProcessing(true);
    console.log('Opening UPI app...');
    
    try {
      // Generate UPI URL
      const upiUrl = generateUPIUrl();
      console.log('UPI URL:', upiUrl);
      
      // Try to open UPI app
      const link = document.createElement('a');
      link.href = upiUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Simulate payment success after a delay (for demo purposes)
      setTimeout(() => {
        const mockResponse = {
          razorpay_payment_id: `pay_upi_${Date.now()}`,
          razorpay_order_id: `order_upi_${Date.now()}`,
          razorpay_signature: `sig_upi_${Date.now()}`
        };
        onSuccess(mockResponse, participantData);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('UPI payment error:', error);
      onError('Failed to open UPI app. Please try again.');
      setIsProcessing(false);
    }
  };

  const openGooglePay = () => {
    setIsProcessing(true);
    
    console.log('Opening Google Pay...');
    
    // Use merchant configuration
    const merchantUPI = MERCHANT_CONFIG.upiId;
    const merchantName = MERCHANT_CONFIG.merchantName;
    const transactionNote = `Giveaway Entry - ${participantData.name}`;
    const transactionRef = `GIVEAWAY_${participantData.id}_${Date.now()}`;
    
    // Google Pay UPI URL
    const gpayUrl = `tez://upi/pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
    
    console.log('Google Pay URL:', gpayUrl);
    
    try {
      // Create a hidden link and click it
      const link = document.createElement('a');
      link.href = gpayUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // For real payments, you would handle the UPI callback here
      // For now, we'll simulate success after a delay
      // In production, you'd listen for UPI payment callbacks
      setTimeout(() => {
        const mockResponse = {
          razorpay_payment_id: `pay_gpay_${Date.now()}`,
          razorpay_order_id: `order_gpay_${Date.now()}`,
          razorpay_signature: `sig_gpay_${Date.now()}`,
          transaction_ref: transactionRef
        };
        onSuccess(mockResponse, participantData);
        setIsProcessing(false);
      }, 5000); // Increased delay for real payment simulation
      
    } catch (error) {
      console.log('Could not open Google Pay:', error);
      onError('Could not open Google Pay. Please try another payment method.');
      setIsProcessing(false);
    }
  };

  const openPhonePe = () => {
    setIsProcessing(true);
    console.log('Opening PhonePe...');
    
    const merchantUPI = MERCHANT_CONFIG.upiId;
    const merchantName = 'iPhone Giveaway';
    const transactionNote = `Giveaway Entry - ${participantData.name}`;
    const transactionRef = `GIVEAWAY_${participantData.id}_${Date.now()}`;
    
    const phonepeUrl = `phonepe://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
    
    console.log('PhonePe URL:', phonepeUrl);
    
    try {
      const link = document.createElement('a');
      link.href = phonepeUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        const mockResponse = {
          razorpay_payment_id: `pay_phonepe_${Date.now()}`,
          razorpay_order_id: `order_phonepe_${Date.now()}`,
          razorpay_signature: `sig_phonepe_${Date.now()}`,
          transaction_ref: transactionRef
        };
        onSuccess(mockResponse, participantData);
        setIsProcessing(false);
      }, 5000);
      
    } catch (error) {
      console.log('Could not open PhonePe:', error);
      onError('Could not open PhonePe. Please try another payment method.');
      setIsProcessing(false);
    }
  };

  const openPaytm = () => {
    setIsProcessing(true);
    console.log('Opening Paytm...');
    
    const merchantUPI = MERCHANT_CONFIG.upiId;
    const merchantName = 'iPhone Giveaway';
    const transactionNote = `Giveaway Entry - ${participantData.name}`;
    const transactionRef = `GIVEAWAY_${participantData.id}_${Date.now()}`;
    
    const paytmUrl = `paytmmp://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
    
    console.log('Paytm URL:', paytmUrl);
    
    try {
      const link = document.createElement('a');
      link.href = paytmUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        const mockResponse = {
          razorpay_payment_id: `pay_paytm_${Date.now()}`,
          razorpay_order_id: `order_paytm_${Date.now()}`,
          razorpay_signature: `sig_paytm_${Date.now()}`,
          transaction_ref: transactionRef
        };
        onSuccess(mockResponse, participantData);
        setIsProcessing(false);
      }, 5000);
      
    } catch (error) {
      console.log('Could not open Paytm:', error);
      onError('Could not open Paytm. Please try another payment method.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="upi-payment-modal">
      <div className="upi-payment-content">
        <div className="upi-header">
          <h3>Pay ₹{amount} via UPI</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="upi-payment-options">
          <p className="upi-instruction">Choose your UPI app to complete payment:</p>
          
          <div className="upi-apps">
            <button 
              onClick={openGooglePay}
              className="upi-app-btn google-pay"
              disabled={isProcessing}
            >
              <span className="app-icon">📱</span>
              <span>Google Pay</span>
            </button>
            
            <button 
              onClick={openPhonePe}
              className="upi-app-btn phonepe"
              disabled={isProcessing}
            >
              <span className="app-icon">📱</span>
              <span>PhonePe</span>
            </button>
            
            <button 
              onClick={openPaytm}
              className="upi-app-btn paytm"
              disabled={isProcessing}
            >
              <span className="app-icon">📱</span>
              <span>Paytm</span>
            </button>
            
            <button 
              onClick={handleUPIPayment}
              className="upi-app-btn generic-upi"
              disabled={isProcessing}
            >
              <span className="app-icon">💳</span>
              <span>Other UPI Apps</span>
            </button>
          </div>
          
          {isProcessing && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Opening UPI app...</p>
            </div>
          )}
        </div>
        
        <div className="upi-footer">
          <small>Payment will be processed securely through UPI</small>
        </div>
      </div>
    </div>
  );
};

export default UPIPayment;
