import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting development environment...\n');

// Start API server
console.log('📡 Starting API server...');
const apiServer = spawn('node', ['local-api-server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

apiServer.stdout.on('data', (data) => {
  console.log(`[API] ${data.toString().trim()}`);
});

apiServer.stderr.on('data', (data) => {
  console.error(`[API ERROR] ${data.toString().trim()}`);
});

// Start Vite dev server
console.log('🎨 Starting Vite dev server...');
const viteServer = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'pipe',
  shell: true
});

viteServer.stdout.on('data', (data) => {
  console.log(`[VITE] ${data.toString().trim()}`);
});

viteServer.stderr.on('data', (data) => {
  console.error(`[VITE ERROR] ${data.toString().trim()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  apiServer.kill();
  viteServer.kill();
  process.exit(0);
});

// Keep the process running
process.stdin.resume();
