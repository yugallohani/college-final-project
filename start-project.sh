#!/bin/bash

# NeuroScan AI - Start Project
# Run this after quick-setup.sh is complete

echo "🧠 Starting NeuroScan AI..."
echo ""

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo "⚠️  Starting PostgreSQL..."
    brew services start postgresql@14
    sleep 2
fi

echo "✅ PostgreSQL is running"
echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start backend in background
cd NeuroScan-landing-page/backend
npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Start frontend in background
cd ..
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "📝 Logs:"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "🌐 Open: http://localhost:5173"
echo ""

# Wait for user to press Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
