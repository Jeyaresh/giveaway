import { RAZORPAY_CONFIG } from '../config/merchant';

// API Base URL - points to your backend (updated for Vercel deployment)
const API_BASE_URL = '/api';

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js?v=' + Date.now();
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create order
const createOrder = async (amount, participantData) => {
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
      // Handle specific error cases
      if (response.status === 400 && data.error === 'Email already registered') {
        throw new Error('This email has already participated in the giveaway. Please use a different email address.');
      }
      throw new Error(data.message || 'Failed to create order');
    }

    console.log('Order created successfully via backend:', data.order);
    return data.order;
  } catch (error) {
    console.error('Error creating order via backend:', error);
    throw error;
  }
};

// Verify payment
const verifyPayment = async (response, orderId, participantData) => {
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
    return verifyData;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// Main function to open Razorpay checkout
export const openRazorpayCheckout = async (amount, participantData, onSuccess, onError, onClose) => {
  try {
    // Load Razorpay script
    const razorpayLoaded = await loadRazorpay();
    if (!razorpayLoaded) {
      onError('Razorpay is not loaded. Please try again.');
      return;
    }

    // Create order on backend
    console.log('Starting payment process - calling backend to create order');
    const orderData = await createOrder(amount, participantData);
    console.log('Order data received from backend:', orderData);
    
    const options = {
      key: RAZORPAY_CONFIG.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.id,
      name: RAZORPAY_CONFIG.merchantName,
      description: `Ebook Purchase - ${participantData.name}`,
      image: '/vite.svg',
      handler: async function (response) {
        console.log('Payment successful:', response);
        try {
          await verifyPayment(response, orderData.id, participantData);
          onSuccess(response, participantData);
        } catch (error) {
          onError('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: participantData.name,
        email: participantData.email,
      },
      notes: {
        participant_id: participantData.id,
        product_purchase: 'Granzia Ebook'
      },
      theme: {
        color: '#1e3a8a'
      },
      // Enable all payment methods including GPay and PhonePe
      method: {
        netbanking: true,
        wallet: true,
        upi: true,
        card: true,
        emi: false
      },
      modal: {
        ondismiss: function() {
          onClose();
        }
      }
    };

    console.log('Opening Razorpay with options:', options);
    const razorpay = new window.Razorpay(options);
    
    // Add event listeners for debugging
    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      onError('Payment failed: ' + response.error.description);
    });
    
    razorpay.on('payment.authorized', function (response) {
      console.log('Payment authorized:', response);
    });
    
    razorpay.on('payment.captured', function (response) {
      console.log('Payment captured:', response);
    });
    
    razorpay.open();

  } catch (error) {
    console.error('Payment error:', error);
    onError(error.message || 'Payment failed. Please try again.');
  }
};

export default openRazorpayCheckout;
