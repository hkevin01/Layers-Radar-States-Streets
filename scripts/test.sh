#!/bin/bash
# Test script for Layers Radar States Streets

echo "🧪 Running tests for Layers Radar States Streets..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run tests
echo "🔍 Running test suite..."
npm test

# Run linting
echo "🔍 Running linter..."
npm run lint

echo "✅ All tests completed!"
