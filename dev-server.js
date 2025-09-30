import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory (after build)
app.use(express.static(path.join(__dirname, 'dist')));

// API routes - proxy to Vercel API
app.use('/api', createProxyMiddleware({
  target: 'https://giveaway-3966c.vercel.app',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  }
}));

// Serve the main app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`\n💡 To build the frontend, run: npm run build`);
});
