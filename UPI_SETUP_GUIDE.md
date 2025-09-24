# UPI Payment Setup Guide

## 🚀 Real UPI Payment Integration

Your giveaway application is now configured for real UPI payments! Here's how to set it up:

## 📱 Step 1: Get Your UPI ID

You need a merchant UPI ID to receive payments. Choose one of these options:

### Option 1: Paytm Business
1. Download Paytm for Business app
2. Create a business account
3. Get your UPI ID (e.g., `yourbusiness@paytm`)

### Option 2: PhonePe for Business
1. Download PhonePe for Business app
2. Register your business
3. Get your UPI ID (e.g., `yourbusiness@ybl`)

### Option 3: Google Pay Business
1. Set up Google Pay Business profile
2. Get your UPI ID (e.g., `yourbusiness@okicici`)

### Option 4: Bank UPI
1. Contact your bank for business UPI
2. Get your UPI ID (e.g., `yourbusiness@axisbank`)

## ⚙️ Step 2: Configure Your UPI ID

1. Open `src/config/merchant.js`
2. Replace `'your-merchant@paytm'` with your actual UPI ID:

```javascript
export const MERCHANT_CONFIG = {
  upiId: 'yourbusiness@paytm', // Replace with your actual UPI ID
  merchantName: 'iPhone Giveaway',
  // ... rest of config
};
```

## 🧪 Step 3: Test Your Setup

1. **Test with Small Amounts**: Start with ₹1-₹5 for testing
2. **Use Your Own Device**: Test on your mobile device
3. **Check Console Logs**: Verify UPI URLs are generated correctly

## 📱 Step 4: How It Works

When users click "Pay ₹10 & Enter Giveaway":

1. **UPI Modal Opens**: Shows payment options
2. **User Clicks UPI App**: Google Pay, PhonePe, Paytm, etc.
3. **App Opens**: UPI app opens with payment details
4. **Payment Screen**: Shows "Pay ₹10 to iPhone Giveaway"
5. **User Confirms**: User completes payment in their app
6. **Success**: Payment is processed and user is added to giveaway

## 🔧 Step 5: Production Setup

For production, you'll need:

### Backend Integration
```javascript
// Example: Verify payment on your server
app.post('/verify-payment', async (req, res) => {
  const { transaction_ref, amount, upi_id } = req.body;
  
  // Verify payment with your UPI provider
  const isVerified = await verifyUPIPayment(transaction_ref);
  
  if (isVerified) {
    // Add participant to giveaway
    await addParticipant(req.body);
    res.json({ status: 'success' });
  } else {
    res.json({ status: 'failed' });
  }
});
```

### Database Storage
- Store participant details
- Track payment status
- Manage giveaway entries

### Webhook Handling
- Listen for payment confirmations
- Update participant status
- Send confirmation emails

## 🛡️ Security Best Practices

1. **Verify Payments**: Always verify payments on your backend
2. **Use HTTPS**: Ensure your site uses SSL
3. **Validate Amounts**: Check payment amounts match expected values
4. **Store Transaction IDs**: Keep records of all transactions
5. **Rate Limiting**: Prevent spam payments

## 📊 Monitoring & Analytics

Track these metrics:
- Payment success rate
- Popular UPI apps
- Payment completion time
- Failed payment reasons

## 🆘 Troubleshooting

### UPI App Not Opening
- Check if UPI app is installed
- Verify UPI ID format is correct
- Test on mobile device (not desktop)

### Payment Not Completing
- Check UPI ID is active
- Verify amount is within limits
- Check network connection

### Console Errors
- Check UPI URL format
- Verify merchant configuration
- Check browser console for errors

## 📞 Support

- **UPI Documentation**: Check your UPI provider's docs
- **Bank Support**: Contact your bank for UPI issues
- **Technical Issues**: Check browser console logs

---

## 🎯 Quick Start Checklist

- [ ] Get merchant UPI ID
- [ ] Update `src/config/merchant.js`
- [ ] Test with small amount
- [ ] Verify payment flow
- [ ] Set up backend (optional)
- [ ] Deploy to production

**Your UPI payment integration is ready!** 🚀
