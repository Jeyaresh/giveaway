import { useState, useEffect } from 'react';
import { RAZORPAY_CONFIG } from '../config/merchant';

const API_BASE_URL = '/api'; // Production API endpoint

const RazorpayPayment = ({ 
  amount, 
  participantData,
  onSuccess, 
  onError, 
  onClose 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js?v=' + Date.now();
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const createOrder = async (amount) => {
    try {
      console.log('Creating order via backend for amount:', amount);
      const response = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          participantName: participantData.name,
          participantEmail: participantData.email,
          participantPhone: participantData.phone || null
        })
      });

      console.log('Backend response status:', response.status);
      const data = await response.json();
      console.log('Backend response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      console.log('Order created successfully via backend:', data.order);
      return data.order;
    } catch (error) {
      console.error('Error creating order via backend:', error);
      throw error;
    }
  };

  const verifyPayment = async (response, orderId) => {
    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: orderId,
          razorpay_signature: response.razorpay_signature,
          participantName: participantData.name,
          participantEmail: participantData.email,
          participantPhone: participantData.phone || null,
          amount: participantData.amount
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.message || 'Payment verification failed');
      }

      console.log('Payment verified successfully:', verifyData);
      onSuccess(response, participantData);
      setIsProcessing(false);
    } catch (error) {
      console.error('Payment verification error:', error);
      onError('Payment verification failed. Please contact support.');
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      onError('Razorpay is not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order on backend
      console.log('Starting payment process - calling backend to create order');
      const orderData = await createOrder(amount);
      console.log('Order data received from backend:', orderData);
      
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id, // Use the order ID from backend
        name: RAZORPAY_CONFIG.merchantName,
        description: `Giveaway Entry - ${participantData.name}`,
        image: '/vite.svg', // Add your logo URL
        handler: async function (response) {
          console.log('Payment successful:', response);
          await verifyPayment(response, orderData.id);
        },
        prefill: {
          name: participantData.name,
          email: participantData.email,
        },
        notes: {
          participant_id: participantData.id,
          giveaway_entry: 'iPhone Giveaway'
        },
        theme: {
          color: '#667eea'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            onClose();
          }
        }
      };

      console.log('Opening Razorpay with options:', options);
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        onError('Payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      onError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleGooglePay = async () => {
    if (!razorpayLoaded) {
      onError('Razorpay is not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = await createOrder(amount);
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id, // Use the order ID from backend
        name: RAZORPAY_CONFIG.merchantName,
        description: `Giveaway Entry - ${participantData.name}`,
        handler: async function (response) {
          console.log('Google Pay payment successful:', response);
          await verifyPayment(response, orderData.id);
        },
        prefill: {
          name: participantData.name,
          email: participantData.email,
        },
        theme: {
          color: '#4285f4' // Google Pay blue
        },
        method: {
          netbanking: false,
          wallet: false,
          upi: true,
          card: true
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            onClose();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Google Pay payment failed:', response.error);
        onError('Google Pay payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('Google Pay error:', error);
      onError('Google Pay failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePhonePe = async () => {
    if (!razorpayLoaded) {
      onError('Razorpay is not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = await createOrder(amount);
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id, // Use the order ID from backend
        name: RAZORPAY_CONFIG.merchantName,
        description: `Giveaway Entry - ${participantData.name}`,
        handler: async function (response) {
          console.log('PhonePe payment successful:', response);
          await verifyPayment(response, orderData.id);
        },
        prefill: {
          name: participantData.name,
          email: participantData.email,
        },
        theme: {
          color: '#5f259f' // PhonePe purple
        },
        method: {
          netbanking: false,
          wallet: false,
          upi: true,
          card: true
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            onClose();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('PhonePe payment failed:', response.error);
        onError('PhonePe payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('PhonePe error:', error);
      onError('PhonePe failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePaytm = async () => {
    if (!razorpayLoaded) {
      onError('Razorpay is not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = await createOrder(amount);
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id, // Use the order ID from backend
        name: RAZORPAY_CONFIG.merchantName,
        description: `Giveaway Entry - ${participantData.name}`,
        handler: async function (response) {
          console.log('Paytm payment successful:', response);
          await verifyPayment(response, orderData.id);
        },
        prefill: {
          name: participantData.name,
          email: participantData.email,
        },
        theme: {
          color: '#00baf2' // Paytm blue
        },
        method: {
          netbanking: false,
          wallet: false,
          upi: true,
          card: true
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            onClose();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Paytm payment failed:', response.error);
        onError('Paytm payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('Paytm error:', error);
      onError('Paytm failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="razorpay-payment-modal">
      <div className="razorpay-payment-content">
        <div className="razorpay-header">
          <h3>Pay ₹{amount} via Razorpay</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="razorpay-payment-options">
          <p className="razorpay-instruction">Choose your preferred payment method:</p>
          
          <div className="razorpay-apps">
            <button 
              onClick={handleGooglePay}
              className="razorpay-app-btn google-pay"
              disabled={isProcessing || !razorpayLoaded}
            >
              <span className="app-icon">📱</span>
              <span>Google Pay</span>
            </button>
            
            <button 
              onClick={handlePhonePe}
              className="razorpay-app-btn phonepe"
              disabled={isProcessing || !razorpayLoaded}
            >
              <span className="app-icon">📱</span>
              <span>PhonePe</span>
            </button>
            
            <button 
              onClick={handlePaytm}
              className="razorpay-app-btn paytm"
              disabled={isProcessing || !razorpayLoaded}
            >
              <span className="app-icon">📱</span>
              <span>Paytm</span>
            </button>
            
            <button 
              onClick={handleRazorpayPayment}
              className="razorpay-app-btn razorpay"
              disabled={isProcessing || !razorpayLoaded}
            >
              <span className="app-icon">💳</span>
              <span>All Payment Methods</span>
            </button>
          </div>
          
          {isProcessing && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processing payment...</p>
            </div>
          )}

          {!razorpayLoaded && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading Razorpay...</p>
            </div>
          )}
        </div>
        
        <div className="razorpay-footer">
          <small>Payment will be processed securely through Razorpay</small>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;
