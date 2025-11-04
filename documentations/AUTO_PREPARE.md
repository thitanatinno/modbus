# Automatic Server Preparation - Deployment Script

## What It Does

The deployment script now **automatically prepares the Raspberry Pi server** with all required software and dependencies. No manual server setup is needed!

## Automatic Installation Features

### 1. **Essential Packages**
Automatically installs:
- `curl` - for downloading files
- `wget` - for downloading files
- `ca-certificates` - for SSL/TLS
- `gnupg` - for package verification
- `lsb-release` - for system information

### 2. **Git Installation**
- Checks if Git is installed
- Automatically installs Git if missing
- Required for repository cloning

### 3. **Docker Installation**
- Checks if Docker is installed
- Downloads and runs official Docker installation script
- Adds user to docker group for permissions
- Enables Docker service to start on boot
- Starts Docker service
- Waits for Docker to be ready
- Verifies Docker is working

### 4. **Docker Compose**
- Checks if Docker Compose plugin is available
- Automatically installs docker-compose-plugin if missing
- Verifies installation

## How It Works

### On First Deployment (`./deploy.sh init`)

1. **Connect to Server** - Uses password from `.env` file
2. **Update System** - Updates package lists
3. **Install Essentials** - Installs required system packages
4. **Install Git** - If not present
5. **Install Docker** - Complete Docker setup if not present
6. **Verify Installation** - Checks everything works
7. **Clone Repository** - Gets your code
8. **Upload .env** - Transfers configuration
9. **Build & Run** - Starts your application

### Password Authentication

The script uses `sshpass` to automatically provide the password, so you don't need to:
- Type password multiple times
- Setup SSH keys (though that's still recommended)
- Manually log in to the server

## Requirements

### On Your Local Machine
✅ macOS, Linux, or WSL
✅ Bash shell
✅ `sshpass` installed (script checks and helps install)

### On Raspberry Pi
✅ Raspberry Pi OS (Raspbian)
✅ Network connection
✅ SSH enabled
✅ Working password

**Everything else is installed automatically!**

## Usage

### Test Connection First
```bash
./test-deploy.sh
```

This will:
- Verify `.env` configuration
- Test SSH connection
- Show server information
- List installed software
- Show available serial ports
- Check disk space

### Deploy
```bash
./deploy.sh init
```

The script will automatically:
- Install all missing software
- Setup Docker
- Deploy your application

## What Gets Installed

| Software | Purpose | Installation |
|----------|---------|--------------|
| Git | Repository management | Automatic via apt |
| Docker | Container runtime | Automatic via official script |
| Docker Compose | Container orchestration | Automatic via apt |
| curl, wget | File downloads | Automatic via apt |
| ca-certificates | SSL/TLS support | Automatic via apt |

## Installation Process

### Git Installation
```bash
sudo apt-get update
sudo apt-get install -y git
```

### Docker Installation
```bash
# Download official Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run installation script
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker pi

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Cleanup
rm get-docker.sh
```

### Docker Compose
```bash
sudo apt-get install -y docker-compose-plugin
```

## Password Security

### Stored in .env (Not in Git)
```bash
PI_PASSWORD=di2025za
```

### Used by sshpass
```bash
sshpass -p 'password' ssh pi@192.168.20.228
```

### Security Notes
- ✅ `.env` file is in `.gitignore` (never committed)
- ✅ Password only stored locally
- ✅ Transmitted over SSH (encrypted)
- ⚠️ Consider changing default password
- 💡 Use SSH keys for better security

## Troubleshooting

### Docker Installation Fails
**Symptoms:** Error during Docker installation
**Solution:** 
```bash
# SSH into Pi manually
ssh pi@192.168.20.228

# Check logs
sudo journalctl -xe

# Try manual installation
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Docker Not Starting
**Solution:**
```bash
sudo systemctl status docker
sudo systemctl restart docker
```

### Permission Denied for Docker
**Solution:** Docker group changes require logout
```bash
# On Pi
sudo usermod -aG docker pi
# Log out and back in
```

### Package Installation Fails
**Solution:** Update package lists
```bash
ssh pi@192.168.20.228
sudo apt-get update
sudo apt-get upgrade
```

## Manual Preparation (Optional)

If you prefer to prepare the server manually:

```bash
# Connect to Pi
ssh pi@192.168.20.228

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Git
sudo apt-get install -y git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin

# Log out and back in
exit
```

Then run deployment:
```bash
./deploy.sh init
```

## Benefits of Automatic Preparation

✅ **Zero Manual Setup** - Just run one command
✅ **Consistent Environment** - Same setup every time
✅ **Error Handling** - Checks and fixes issues
✅ **Time Saving** - No manual server configuration
✅ **Reproducible** - Deploy to multiple servers easily
✅ **Beginner Friendly** - No server admin skills needed

## Commands Summary

```bash
# Test everything before deploying
./test-deploy.sh

# Initial deployment (auto-installs everything)
./deploy.sh init

# Update deployment
./deploy.sh update

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Control application
./deploy.sh start
./deploy.sh stop
./deploy.sh restart
```

## Time Estimates

- **First deployment (with installations):** 10-15 minutes
- **Update deployment:** 1-2 minutes
- **Without installations:** 2-3 minutes

## What You Don't Need To Do

❌ Manually SSH into the server
❌ Run apt-get update/upgrade
❌ Install Git manually
❌ Install Docker manually
❌ Configure Docker permissions
❌ Enable Docker service
❌ Install Docker Compose
❌ Type password multiple times

✅ Just run `./deploy.sh init` and everything is done automatically!
