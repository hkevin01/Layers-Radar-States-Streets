#!/bin/bash
# Build script for Layers Radar States Streets

echo "🚀 Building Layers Radar States Streets..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Format code
echo "💄 Formatting code..."
npm run format

echo "✅ Build completed successfully!"
echo "🌐 To start the application, run: npm start"
