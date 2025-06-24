#!/bin/bash

# Sweetdeli Website Setup Script
echo "🍰 Setting up Sweetdeli Website..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local from template if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please update with your values if needed"
fi

# Build the project to check for errors
echo "🔨 Building project to check for errors..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Setup complete! You can now run:"
    echo "   npm run dev     - Start development server"
    echo "   npm run build   - Build for production"
    echo "   npm run start   - Start production server"
    echo ""
    echo "📱 The website will be available at:"
    echo "   http://localhost:3000      - Main page"
    echo "   http://localhost:3000/demo - Demo page"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
