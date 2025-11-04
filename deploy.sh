#!/bin/bash

# Deployment script for meter-mqtt
# Usage: ./deploy.sh [init|update]

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found!"
    echo "Please create a .env file with the required configuration."
    exit 1
fi

# Configuration from .env
PI_SSH="${PI_USER}@${PI_HOST}"
REPO_URL_WITH_TOKEN="https://${GITHUB_TOKEN}@github.com/thitanatinno/modbus.git"
REMOTE_PATH="${APP_DIR}"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    print_warning "sshpass not found. Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            print_error "Homebrew not found. Please install sshpass manually:"
            echo "  brew install hudochenkov/sshpass/sshpass"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

# SSH command with password
SSH_CMD="sshpass -p '${PI_PASSWORD}' ssh -o StrictHostKeyChecking=no"
SCP_CMD="sshpass -p '${PI_PASSWORD}' scp -o StrictHostKeyChecking=no"
RSYNC_CMD="sshpass -p '${PI_PASSWORD}' rsync -e 'ssh -o StrictHostKeyChecking=no'"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check SSH connection
check_ssh() {
    print_info "Checking SSH connection to ${PI_SSH}..."
    if eval "${SSH_CMD} ${PI_SSH} exit" 2>/dev/null; then
        print_success "SSH connection successful"
        return 0
    else
        print_error "Cannot connect to ${PI_SSH}"
        print_info "Please ensure:"
        echo "  1. The Raspberry Pi is powered on and connected to the network"
        echo "  2. SSH is enabled on the Pi"
        echo "  3. The password in .env file is correct"
        return 1
    fi
}

# Function to configure firewall for port 3000
configure_firewall() {
    print_info "=== Configuring firewall for port 3000 ==="
    
    # Check if ufw is installed
    if eval "${SSH_CMD} ${PI_SSH} 'command -v ufw'" &>/dev/null; then
        print_info "UFW firewall detected"
        
        # Check if UFW is active
        UFW_STATUS=$(eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S ufw status'" 2>/dev/null | grep -i "Status:")
        
        if echo "$UFW_STATUS" | grep -qi "active"; then
            print_info "UFW is active, checking port 3000..."
            
            # Check if port 3000 is already allowed
            if eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S ufw status'" | grep -q "3000"; then
                print_success "Port 3000 is already allowed in UFW"
            else
                print_info "Opening port 3000 in UFW..."
                eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S ufw allow 3000/tcp'"
                if [ $? -eq 0 ]; then
                    print_success "Port 3000 opened successfully in UFW"
                else
                    print_warning "Failed to open port 3000 in UFW"
                fi
            fi
        else
            print_info "UFW is installed but not active"
        fi
    else
        print_info "UFW not found, checking iptables..."
        
        # Check if iptables has rules
        IPTABLES_RULES=$(eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S iptables -L -n'" 2>/dev/null)
        
        if echo "$IPTABLES_RULES" | grep -q "3000"; then
            print_success "Port 3000 appears to be configured in iptables"
        else
            print_info "Adding iptables rule for port 3000..."
            eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S iptables -A INPUT -p tcp --dport 3000 -j ACCEPT'"
            
            # Try to save iptables rules (method varies by distro)
            eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S sh -c \"iptables-save > /etc/iptables/rules.v4\"'" 2>/dev/null || \
            eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S netfilter-persistent save'" 2>/dev/null || \
            print_warning "Could not persist iptables rules (may reset on reboot)"
            
            print_success "Port 3000 configured in iptables"
        fi
    fi
    
    print_success "Firewall configuration completed"
}

# Function to check if API is accessible remotely
check_api_access() {
    print_info "=== Checking API accessibility ==="
    
    # Get Raspberry Pi's IP address
    PI_IP=$(eval "${SSH_CMD} ${PI_SSH} \"hostname -I | awk '{print \$1}'\"" 2>/dev/null | tr -d '[:space:]')
    
    if [ -z "$PI_IP" ]; then
        print_warning "Could not determine Raspberry Pi IP address"
        return 1
    fi
    
    print_info "Raspberry Pi IP: ${PI_IP}"
    
    # Wait for application to start
    print_info "Waiting for application to start (5 seconds)..."
    sleep 5
    
    # Check if port 3000 is listening on the Pi
    print_info "Checking if port 3000 is listening on Raspberry Pi..."
    PORT_CHECK=$(eval "${SSH_CMD} ${PI_SSH} 'ss -tulpn | grep :3000 || netstat -tulpn | grep :3000'" 2>/dev/null)
    
    if [ -n "$PORT_CHECK" ]; then
        print_success "Port 3000 is listening on Raspberry Pi"
        echo "$PORT_CHECK"
    else
        print_warning "Port 3000 does not appear to be listening"
        print_info "Checking Docker container status..."
        eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose ps'"
        return 1
    fi
    
    # Try to access the API from the remote Pi itself (localhost test)
    print_info "Testing API access from localhost on Raspberry Pi..."
    LOCALHOST_TEST=$(eval "${SSH_CMD} ${PI_SSH} 'curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000/health --max-time 5'" 2>/dev/null)
    
    if [ "$LOCALHOST_TEST" = "200" ]; then
        print_success "API is accessible on localhost (HTTP 200)"
    else
        print_warning "API localhost test returned: ${LOCALHOST_TEST}"
    fi
    
    # Try to access from the machine running this script
    print_info "Testing remote API access from this machine..."
    if command -v curl &> /dev/null; then
        REMOTE_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://${PI_IP}:3000/health" --max-time 10 2>/dev/null)
        
        if [ "$REMOTE_TEST" = "200" ]; then
            print_success "✅ API is accessible remotely from this machine!"
            print_success "API URL: http://${PI_IP}:3000"
            echo ""
            print_info "You can test the API with:"
            echo "  curl http://${PI_IP}:3000/"
            echo "  curl http://${PI_IP}:3000/health"
            echo "  curl http://${PI_IP}:3000/api/coils/latest"
            echo ""
        else
            print_warning "Remote API test returned: ${REMOTE_TEST}"
            print_info "This could be due to:"
            echo "  1. Firewall blocking the connection (router/network firewall)"
            echo "  2. Docker network configuration"
            echo "  3. Application not fully started yet"
            echo ""
            print_info "Try accessing: http://${PI_IP}:3000/health"
        fi
    else
        print_warning "curl not found on this machine, cannot test remote access"
        print_info "Please manually test: http://${PI_IP}:3000/health"
    fi
    
    # Show additional network information
    print_info "Network binding information:"
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose exec -T meter-mqtt netstat -tulpn 2>/dev/null | grep :3000 || ss -tulpn | grep :3000'" 2>/dev/null || print_warning "Could not retrieve network binding info"
    
    return 0
}

# Function to prepare server environment
prepare_server() {
    print_info "=== Preparing server environment ==="
    
    # Update package lists
    print_info "Updating package lists..."
    eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S apt-get update'" || print_warning "Failed to update package lists"
    
    # Install essential packages
    print_info "Installing essential packages..."
    eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S apt-get install -y curl wget ca-certificates gnupg lsb-release net-tools'" || print_warning "Some packages may not have been installed"
    
    print_success "Server preparation completed"
}

# Function to initialize deployment (first time setup)
init_deployment() {
    print_info "=== Initializing deployment on ${PI_SSH} ==="
    
    # Check SSH connection
    if ! check_ssh; then
        exit 1
    fi
    
    # Prepare server environment
    prepare_server
    
    # Check if directory already exists
    print_info "Checking if application already exists..."
    if eval "${SSH_CMD} ${PI_SSH} '[ -d ${REMOTE_PATH} ]'"; then
        print_warning "Directory ${REMOTE_PATH} already exists on the remote host"
        read -p "Do you want to remove it and start fresh? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Removing existing directory..."
            eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose down 2>/dev/null || true && cd .. && rm -rf ${REMOTE_PATH}'"
        else
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Check and install Git if not present
    print_info "Checking Git installation..."
    if ! eval "${SSH_CMD} ${PI_SSH} 'command -v git'" &>/dev/null; then
        print_warning "Git not found. Installing Git..."
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S apt-get update && echo ${PI_PASSWORD} | sudo -S apt-get install -y git'"
        print_success "Git installed successfully"
    else
        print_success "Git already installed"
    fi
    
    # Install Docker and Docker Compose if not present
    print_info "Checking Docker installation..."
    if ! eval "${SSH_CMD} ${PI_SSH} 'command -v docker'" &>/dev/null; then
        print_warning "Docker not found. Installing Docker..."
        
        # Install Docker using official script
        print_info "Downloading Docker installation script..."
        eval "${SSH_CMD} ${PI_SSH} 'curl -fsSL https://get.docker.com -o get-docker.sh'"
        
        print_info "Running Docker installation script (this may take a few minutes)..."
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S sh get-docker.sh'"
        
        print_info "Adding user to docker group..."
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S usermod -aG docker ${PI_USER}'"
        
        print_info "Enabling Docker service..."
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S systemctl enable docker'"
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S systemctl start docker'"
        
        print_info "Cleaning up installation script..."
        eval "${SSH_CMD} ${PI_SSH} 'rm -f get-docker.sh'"
        
        print_success "Docker installed successfully!"
        print_warning "Note: Docker group changes will take effect on next login"
        
        # Wait for Docker to be ready
        print_info "Waiting for Docker to be ready..."
        sleep 5
    else
        print_success "Docker already installed"
        
        # Check if Docker service is running
        print_info "Checking Docker service status..."
        if ! eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S systemctl is-active docker'" &>/dev/null; then
            print_warning "Docker service is not running. Starting..."
            eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S systemctl start docker'"
            sleep 3
        fi
    fi
    
    # Verify Docker is working
    print_info "Verifying Docker installation..."
    if eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S docker version'" &>/dev/null; then
        print_success "Docker is working correctly"
    else
        print_error "Docker verification failed"
        print_warning "Trying to fix Docker daemon..."
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S systemctl restart docker'"
        sleep 5
    fi
    
    # Check Docker Compose
    print_info "Checking Docker Compose..."
    if ! eval "${SSH_CMD} ${PI_SSH} 'docker compose version'" &>/dev/null; then
        print_warning "Docker Compose plugin not found. Installing..."
        eval "${SSH_CMD} ${PI_SSH} 'echo ${PI_PASSWORD} | sudo -S apt-get update && echo ${PI_PASSWORD} | sudo -S apt-get install -y docker-compose-plugin'"
        print_success "Docker Compose plugin installed"
    else
        print_success "Docker Compose is available"
    fi
    
    # Clone repository
    print_info "Cloning repository from GitHub..."
    if eval "${SSH_CMD} ${PI_SSH} 'git clone ${REPO_URL_WITH_TOKEN} ${REMOTE_PATH}'"; then
        print_success "Repository cloned successfully"
    else
        print_error "Failed to clone repository"
        print_info "Attempting alternative: copying files via RSYNC..."
        
        # Create directory
        eval "${SSH_CMD} ${PI_SSH} 'mkdir -p ${REMOTE_PATH}'"
        
        # Copy files (excluding .git and node_modules, but including .env)
        print_info "Copying files to remote host..."
        eval "${RSYNC_CMD} -av --exclude='.git' --exclude='node_modules' --exclude='.env.local' ./ ${PI_SSH}:${REMOTE_PATH}/"
        
        if [ $? -eq 0 ]; then
            print_success "Files copied successfully (including .env)"
        else
            print_error "Failed to copy files"
            exit 1
        fi
    fi
    
    # Ensure .env file is uploaded to server (redundant check)
    print_info "Ensuring .env file is on server..."
    if [ -f .env ]; then
        eval "${SCP_CMD} .env ${PI_SSH}:${REMOTE_PATH}/.env"
    else
        print_error ".env file not found locally!"
        exit 1
    fi
    if [ $? -eq 0 ]; then
        print_success ".env file uploaded successfully"
    else
        print_error "Failed to upload .env file"
        exit 1
    fi
    
    # Copy or update config if needed
    print_info "Setting up configuration..."
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && [ ! -f config.js ] && cp config.js config.js.example || true'"
    
    # Find serial port
    print_info "Detecting serial ports..."
    SERIAL_PORTS=$(eval "${SSH_CMD} ${PI_SSH} 'ls /dev/ttyUSB* /dev/ttyAMA* 2>/dev/null || echo \"No serial ports found\"'")
    print_info "Available serial ports on Pi:"
    echo "${SERIAL_PORTS}"
    
    # Build and start Docker container
    print_info "Building Docker image..."
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose build'"
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
    
    print_info "Starting Docker container..."
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose up -d'"
    
    if [ $? -eq 0 ]; then
        print_success "Docker container started successfully"
    else
        print_error "Failed to start Docker container"
        exit 1
    fi
    
    # Configure firewall for port 3000
    configure_firewall
    
    # Check API accessibility
    check_api_access
    
    # Show logs
    print_info "Showing initial logs (Ctrl+C to exit)..."
    sleep 2
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose logs -f --tail=50'"
}

# Function to update deployment
update_deployment() {
    print_info "=== Updating deployment on ${PI_SSH} ==="
    
    # Check SSH connection
    if ! check_ssh; then
        exit 1
    fi
    
    # Check if directory exists
    if ! eval "${SSH_CMD} ${PI_SSH} '[ -d ${REMOTE_PATH} ]'"; then
        print_error "Application not found at ${REMOTE_PATH}"
        print_info "Please run './deploy.sh init' first to initialize the deployment"
        exit 1
    fi
    
    # Pull latest changes
    print_info "Pulling latest changes..."
    if eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && git pull origin main'"; then
        print_success "Repository updated successfully"
    else
        print_warning "Git pull failed, trying alternative method..."
        
        # Stop container
        print_info "Stopping container..."
        eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose down'"
        
        # Copy updated files
        print_info "Copying updated files..."
        eval "${RSYNC_CMD} -av --exclude='.git' --exclude='node_modules' --exclude='.env.local' ./ ${PI_SSH}:${REMOTE_PATH}/"
        
        if [ $? -eq 0 ]; then
            print_success "Files updated successfully (including .env)"
        else
            print_error "Failed to update files"
            exit 1
        fi
    fi
    
    # Always upload .env file during update (ensure it's there)
    print_info "Ensuring latest .env file is on server..."
    if [ -f .env ]; then
        eval "${SCP_CMD} .env ${PI_SSH}:${REMOTE_PATH}/.env"
        if [ $? -eq 0 ]; then
            print_success ".env file updated successfully"
        else
            print_warning "Failed to update .env file (continuing anyway)"
        fi
    else
        print_warning ".env file not found locally!"
    fi
    
    # Rebuild and restart container
    print_info "Rebuilding Docker image..."
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose build'"
    
    print_info "Restarting Docker container..."
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose down && docker compose up -d'"
    
    if [ $? -eq 0 ]; then
        print_success "Application updated and restarted successfully"
    else
        print_error "Failed to restart application"
        exit 1
    fi
    
    # Configure firewall for port 3000 (in case it's not configured)
    configure_firewall
    
    # Check API accessibility
    check_api_access
    
    # Show logs
    print_info "Showing logs (Ctrl+C to exit)..."
    sleep 2
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose logs -f --tail=50'"
}

# Function to show logs
show_logs() {
    print_info "=== Showing logs from ${PI_SSH} ==="
    
    if ! check_ssh; then
        exit 1
    fi
    
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose logs -f --tail=100'"
}

# Function to show status
show_status() {
    print_info "=== Checking status on ${PI_SSH} ==="
    
    if ! check_ssh; then
        exit 1
    fi
    
    print_info "Container status:"
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose ps'"
    
    print_info "\nRecent logs:"
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose logs --tail=20'"
}

# Function to stop application
stop_app() {
    print_info "=== Stopping application on ${PI_SSH} ==="
    
    if ! check_ssh; then
        exit 1
    fi
    
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose down'"
    print_success "Application stopped"
}

# Function to start application
start_app() {
    print_info "=== Starting application on ${PI_SSH} ==="
    
    if ! check_ssh; then
        exit 1
    fi
    
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose up -d'"
    print_success "Application started"
}

# Function to restart application
restart_app() {
    print_info "=== Restarting application on ${PI_SSH} ==="
    
    if ! check_ssh; then
        exit 1
    fi
    
    eval "${SSH_CMD} ${PI_SSH} 'cd ${REMOTE_PATH} && docker compose restart'"
    print_success "Application restarted"
    
    # Check API accessibility after restart
    check_api_access
}

# Function to check firewall and API access
check_firewall_and_api() {
    print_info "=== Checking firewall and API accessibility ==="
    
    if ! check_ssh; then
        exit 1
    fi
    
    configure_firewall
    check_api_access
}

# Main script logic
case "$1" in
    init)
        init_deployment
        ;;
    update)
        update_deployment
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    stop)
        stop_app
        ;;
    start)
        start_app
        ;;
    restart)
        restart_app
        ;;
    check)
        check_firewall_and_api
        ;;
    *)
        echo "Usage: $0 {init|update|logs|status|start|stop|restart|check}"
        echo ""
        echo "Commands:"
        echo "  init     - Initial deployment (clone repo and start application)"
        echo "  update   - Update existing deployment (pull changes and restart)"
        echo "  logs     - Show application logs"
        echo "  status   - Show application status"
        echo "  start    - Start the application"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  check    - Check firewall configuration and API accessibility"
        exit 1
        ;;
esac
