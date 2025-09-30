# Local Development Guide

This guide will help you run the ebook sales platform both locally and on Vercel.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Quick Start

### Option 1: Full Local Development (Recommended)

This runs both the frontend and API locally:

```bash
# Install dependencies
npm install

# Start both frontend and API servers
npm run dev:full
```

This will start:
- Frontend: http://localhost:5173
- API: http://localhost:3001

### Option 2: Frontend Only (Uses Vercel API)

If you want to test the frontend with the live Vercel API:

```bash
# Install dependencies
npm install

# Start only the frontend
npm run dev
```

### Option 3: API Only

If you want to run just the API server:

```bash
# Install dependencies
npm install

# Start API server
npm run dev:api
```

## Environment Setup

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Fill in your actual values in `.env`:
   ```env
   RAZORPAY_KEY_ID=your_actual_key_id
   RAZORPAY_SECRET_KEY=your_actual_secret_key
   # ... other values
   ```

## Development Workflow

### Local Development
1. Run `npm run dev:full` to start both servers
2. Make changes to your code
3. The frontend will hot-reload automatically
4. The API will restart automatically when you change API files

### Testing Changes
1. Make your changes locally
2. Test thoroughly on localhost
3. When ready, commit and push to GitHub
4. Vercel will automatically deploy your changes

## Project Structure

```
giveaway/
├── src/                    # Frontend React code
│   ├── App.jsx            # Main application
│   ├── components/        # React components
│   └── pages/             # Page components
├── api/                   # Vercel API functions
│   ├── create-order.js    # Order creation
│   ├── verify-payment.js  # Payment verification
│   └── ...
├── local-api-server.js    # Local API server
├── dev-start.js           # Development startup script
└── package.json           # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run dev:api` - Start local API server
- `npm run dev:full` - Start both frontend and API
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run start` - Start production server

## Troubleshooting

### Dependencies Issues
If you get dependency errors:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
If ports 5173 or 3001 are in use:
- Change the port in `vite.config.js` for frontend
- Change the port in `local-api-server.js` for API
- Update the proxy target in `vite.config.js` accordingly

### API Connection Issues
- Make sure the API server is running on port 3001
- Check that your environment variables are set correctly
- Verify that the proxy configuration in `vite.config.js` is correct

## Deployment

### Vercel Deployment
1. Push your changes to GitHub
2. Vercel will automatically deploy
3. Your API will be available at `https://your-app.vercel.app/api`

### Local Production Build
```bash
# Build the frontend
npm run build

# Start production server
npm run start
```

## Features

### Local Development
- ✅ Hot reload for frontend changes
- ✅ Local API server with real Firebase integration
- ✅ Proxy configuration for seamless API calls
- ✅ Environment variable support
- ✅ Full payment flow testing

### Production (Vercel)
- ✅ Serverless API functions
- ✅ Automatic deployments from GitHub
- ✅ Global CDN
- ✅ HTTPS by default
- ✅ Environment variable management

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify your environment variables
3. Ensure all dependencies are installed
4. Check that ports are not in use by other applications

## Next Steps

1. Set up your environment variables
2. Test the payment flow locally
3. Deploy to Vercel for production
4. Monitor the application for any issues

Happy coding! 🚀
