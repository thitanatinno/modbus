#!/bin/bash

# Quick test deployment script
# This script tests the deployment without actually deploying

echo "🔍 Testing Deployment Configuration"
echo "===================================="
echo ""

# Check .env file
if [ -f .env ]; then
    echo "✅ .env file found"
    
    # Load and display (sanitized)
    source .env
    echo ""
    echo "📋 Configuration:"
    echo "   PI_USER: ${PI_USER}"
    echo "   PI_HOST: ${PI_HOST}"
    echo "   APP_DIR: ${APP_DIR}"
    echo "   GITHUB_TOKEN: ${GITHUB_TOKEN:0:20}...${GITHUB_TOKEN: -10}"
    echo "   SERIAL_PORT: ${SERIAL_PORT}"
    echo "   BAUD_RATE: ${BAUD_RATE}"
    echo "   MODBUS_SLAVE_ID: ${MODBUS_SLAVE_ID}"
    echo ""
else
    echo "❌ .env file not found!"
    echo "   Please create .env file from .env.example"
    exit 1
fi

# Check sshpass
if command -v sshpass &> /dev/null; then
    echo "✅ sshpass is installed"
else
    echo "❌ sshpass is not installed"
    echo "   Install with: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# Test SSH connection
echo ""
echo "🔌 Testing SSH connection to ${PI_USER}@${PI_HOST}..."
if sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${PI_USER}@${PI_HOST}" exit 2>/dev/null; then
    echo "✅ SSH connection successful"
    
    # Get system info
    echo ""
    echo "💻 Server Information:"
    OS_INFO=$(sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"'")
    echo "   OS: ${OS_INFO}"
    
    ARCH=$(sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "uname -m")
    echo "   Architecture: ${ARCH}"
    
    # Check Docker
    if sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "command -v docker" &>/dev/null; then
        DOCKER_VERSION=$(sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "docker --version")
        echo "   Docker: ${DOCKER_VERSION}"
    else
        echo "   Docker: ❌ Not installed (will be installed during deployment)"
    fi
    
    # Check Git
    if sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "command -v git" &>/dev/null; then
        GIT_VERSION=$(sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "git --version")
        echo "   Git: ${GIT_VERSION}"
    else
        echo "   Git: ❌ Not installed (will be installed during deployment)"
    fi
    
    # Check disk space
    DISK_SPACE=$(sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "df -h / | tail -1 | awk '{print \$4}'")
    echo "   Available disk space: ${DISK_SPACE}"
    
    # Check serial ports
    echo ""
    echo "🔌 Available serial ports:"
    SERIAL_PORTS=$(sshpass -p "${PI_PASSWORD}" ssh -o StrictHostKeyChecking=no "${PI_USER}@${PI_HOST}" "ls /dev/ttyUSB* /dev/ttyAMA* 2>/dev/null || echo 'None found'")
    echo "${SERIAL_PORTS}" | while read -r line; do
        echo "   - ${line}"
    done
    
else
    echo "❌ SSH connection failed"
    echo "   Please check:"
    echo "   1. Raspberry Pi is powered on and connected"
    echo "   2. IP address is correct: ${PI_HOST}"
    echo "   3. Password is correct in .env file"
    exit 1
fi

echo ""
echo "✅ All checks passed! Ready to deploy."
echo ""
echo "To deploy, run:"
echo "   ./deploy.sh init"
