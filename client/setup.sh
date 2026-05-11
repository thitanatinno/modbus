#!/bin/bash

# Power Meter Dashboard - Quick Setup Script

echo "=========================================="
echo "Power Meter Dashboard - Setup"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the power-meter-dashboard directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and set your API URL:"
    echo "   REACT_APP_API_BASE_URL=http://localhost:3000"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure the Modbus API server is running (from parent directory)"
echo "2. Start the dashboard: npm start"
echo "3. Open http://localhost:3001 in your browser"
echo ""
echo "Commands:"
echo "  npm start        - Start development server"
echo "  npm run build    - Build for production"
echo "  npm test         - Run tests"
echo ""
