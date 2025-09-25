const fs = require('fs');
const path = require('path');

// Create .env file
const envContent = `# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_RLr3XtQd5owAlC
RAZORPAY_SECRET_KEY=your_secret_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_here_change_this_in_production
API_RATE_LIMIT=100

# Database
DB_PATH=./database/giveaway.db

# CORS
FRONTEND_URL=http://localhost:5174
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file created');

// Create database directory
const dbDir = './database';
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ Database directory created');
}

console.log('🎉 Backend setup complete!');
console.log('📝 Please update the RAZORPAY_SECRET_KEY in .env file with your actual secret key');
console.log('🚀 Run "npm install" to install dependencies');
console.log('🚀 Run "npm run dev" to start the development server');
