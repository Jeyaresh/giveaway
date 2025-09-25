# iPhone Giveaway Backend

A secure Node.js/Express backend for the iPhone Giveaway application with Razorpay payment integration.

## Features

- 🔒 **Secure Payment Processing**: Server-side order creation and payment verification
- 🛡️ **Security Middleware**: Helmet, CORS, Rate limiting, Input validation
- 💾 **Database Storage**: SQLite database for participants and transactions
- 📊 **Payment Tracking**: Complete payment logs and statistics
- 🔍 **Error Handling**: Comprehensive error handling and logging

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   node setup.js
   ```
   Then edit `.env` file and add your Razorpay secret key.

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Environment Variables

- `RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_SECRET_KEY`: Your Razorpay Secret Key (keep this secure!)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret for JWT tokens
- `API_RATE_LIMIT`: Rate limit per IP (default: 100)
- `DB_PATH`: SQLite database path
- `FRONTEND_URL`: Frontend URL for CORS

## API Endpoints

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify-payment` - Verify payment signature
- `GET /api/payments/stats` - Get payment statistics

### Participants
- `GET /api/participants` - Get all participants
- `GET /api/participants/:id` - Get participant by ID
- `GET /api/participants/:id/logs` - Get payment logs for participant
- `GET /api/participants/check-email/:email` - Check if email exists

## Security Features

- ✅ Input validation and sanitization
- ✅ Rate limiting to prevent abuse
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Payment signature verification
- ✅ Duplicate payment prevention
- ✅ Comprehensive error handling
- ✅ Payment logging and tracking

## Database Schema

### Participants Table
- Stores participant information and payment details
- Includes Razorpay payment IDs and signatures
- Tracks payment status and timestamps

### Transactions Table
- Detailed payment information from Razorpay
- Payment method, bank reference, wallet details
- Links to participants table

### Payment Logs Table
- Audit trail for all payment actions
- IP address and user agent tracking
- Debugging and security monitoring

## Development

The backend runs on `http://localhost:3001` by default. Make sure to update the `FRONTEND_URL` in your `.env` file to match your frontend URL.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Set up proper database backups
4. Configure reverse proxy (nginx)
5. Enable HTTPS
6. Set up monitoring and logging
