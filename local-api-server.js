import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import API routes
import createOrder from './api/create-order.js';
import verifyPayment from './api/verify-payment.js';
import participants from './api/participants.js';
import stats from './api/stats.js';

// API Routes
app.post('/api/create-order', createOrder);
app.post('/api/verify-payment', verifyPayment);
app.get('/api/participants', participants);
app.get('/api/stats', stats);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Local API server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🔗 Local API server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n💡 Make sure to set your environment variables in a .env file`);
});
