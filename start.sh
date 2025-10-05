#!/bin/bash

echo "🚀 Starting iPhone Giveaway App..."
echo ""

# Start backend server
echo "📡 Starting backend server..."
cd backend && node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo "📡 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
