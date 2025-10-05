const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { createOrder, verifyPayment, fetchPayment } = require('../config/razorpay');
const { addParticipant, addTransaction, checkEmailExists, checkPaymentIdExists } = require('../config/firebase');
const router = express.Router();

// Validation middleware
const validatePaymentRequest = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('participantName').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('participantEmail').isEmail().withMessage('Valid email is required'),
  body('participantEmail').normalizeEmail()
];

// Create payment order
router.post('/create-order', validatePaymentRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, participantName, participantEmail, participantPhone } = req.body;

    // Check if email already exists in Firebase
    const emailExists = await checkEmailExists(participantEmail);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        message: 'This email has already participated in the giveaway'
      });
    }

    // Create receipt ID
    const receipt = `giveaway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Razorpay order using backend
    try {
      const order = await createOrder({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: receipt,
        notes: {
          participant_name: participantName,
          participant_email: participantEmail,
          participant_phone: participantPhone
        }
      });

      console.log(`Razorpay order created for ${participantEmail}:`, order.id);

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
        },
        participant: {
          name: participantName,
          email: participantEmail,
          phone: participantPhone
        }
      });

    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment order',
        message: 'Payment service temporarily unavailable. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      message: 'Please try again later'
    });
  }
});

// Verify payment
router.post('/verify-payment', [
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  body('participantName').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('participantEmail').isEmail().withMessage('Valid email is required'),
  body('amount').isNumeric().withMessage('Amount is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      participantName,
      participantEmail,
      participantPhone,
      amount
    } = req.body;

    // Verify payment signature
    const isValidSignature = verifyPayment(razorpay_payment_id, razorpay_order_id, razorpay_signature);
    
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
        message: 'Payment verification failed - invalid signature'
      });
    }

    // Fetch payment details from Razorpay
    let paymentDetails;
    try {
      paymentDetails = await fetchPayment(razorpay_payment_id);
      console.log('Payment details fetched:', paymentDetails.id);
      
      // Verify the payment amount matches
      if (paymentDetails.amount !== amount * 100) {
        return res.status(400).json({
          success: false,
          error: 'Amount mismatch',
          message: 'Payment amount does not match expected amount'
        });
      }
      
      // Verify payment status
      if (paymentDetails.status !== 'captured') {
        return res.status(400).json({
          success: false,
          error: 'Payment not captured',
          message: 'Payment was not successfully captured'
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment',
        message: 'Payment verification failed - could not fetch payment details'
      });
    }

    // Check if payment is already processed in Firebase
    const paymentExists = await checkPaymentIdExists(razorpay_payment_id);
    if (paymentExists) {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed',
        message: 'This payment has already been processed'
      });
    }

    // Save to Firebase instead of SQLite
    try {
      // Prepare participant data for Firebase
      const participantData = {
        name: participantName,
        email: participantEmail,
        phone: participantPhone || null,
        amount: paymentDetails.amount / 100, // Convert from paise to rupees
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save participant to Firebase
      const participantResult = await addParticipant(participantData);
      console.log(`Payment verified and saved to Firebase for participant ${participantResult.id}`);

      // Prepare transaction data for Firebase (filter out undefined values)
      const transactionData = {
        participantId: participantResult.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: paymentDetails.amount / 100,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        paymentMethod: paymentDetails.method || null,
        bankReference: paymentDetails.bank_reference || null,
        wallet: paymentDetails.wallet || null,
        vpa: paymentDetails.vpa || null,
        email: paymentDetails.email || null,
        contact: paymentDetails.contact || null,
        notes: paymentDetails.notes || {}
      };

      // Remove any undefined values to prevent Firebase errors
      Object.keys(transactionData).forEach(key => {
        if (transactionData[key] === undefined) {
          delete transactionData[key];
        }
      });

      // Save transaction to Firebase
      await addTransaction(transactionData);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        participant: {
          id: participantResult.id,
          name: participantName,
          email: participantEmail,
          paymentId: razorpay_payment_id
        }
      });

    } catch (firebaseError) {
      console.error('Error saving to Firebase:', firebaseError);
      return res.status(500).json({
        success: false,
        error: 'Firebase error',
        message: 'Failed to save payment data to Firebase'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: 'Please try again later'
    });
  }
});

// Note: Stats endpoint removed - frontend uses Firebase directly

// Note: Transparency endpoint removed - frontend uses Firebase directly

module.exports = router;