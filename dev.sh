#!/bin/bash

# Development helper script
# Quick commands to start server or client

case "$1" in
    server)
        echo "🚀 Starting server..."
        cd server && npm install && npm start
        ;;
    client)
        echo "🚀 Starting client..."
        cd client && npm install && npm start
        ;;
    both)
        echo "🚀 Starting both server and client..."
        echo "Starting server in background..."
        cd server && npm install && npm start &
        SERVER_PID=$!
        echo "Server PID: $SERVER_PID"
        
        echo "Starting client..."
        cd ../client && npm install && npm start
        ;;
    install)
        echo "📦 Installing dependencies for server and client..."
        echo "Installing server dependencies..."
        cd server && npm install
        echo "✅ Server dependencies installed"
        
        echo "Installing client dependencies..."
        cd ../client && npm install
        echo "✅ Client dependencies installed"
        
        echo "✅ All dependencies installed!"
        ;;
    *)
        echo "Development Helper Script"
        echo "========================="
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  server   - Start the backend API server"
        echo "  client   - Start the React dashboard"
        echo "  both     - Start both server and client"
        echo "  install  - Install dependencies for both"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh server"
        echo "  ./dev.sh client"
        echo "  ./dev.sh both"
        echo "  ./dev.sh install"
        exit 1
        ;;
esac
