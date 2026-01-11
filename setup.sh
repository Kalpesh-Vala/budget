#!/bin/bash

# Budget Tracker Setup Script
# This script helps with initial setup

set -e  # Exit on error

echo "🚀 Budget Tracker Setup"
echo "======================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  .env.local file not found. Creating from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please edit it with your MongoDB URI and JWT secret"
    echo ""
    echo "To generate JWT secret, run:"
    echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your MongoDB URI and JWT secret"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo "4. Register a new account"
echo "5. Start tracking expenses!"
