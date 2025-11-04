# Deployment Guide for Raspberry Pi

This guide explains how to deploy the Modbus RS485 reader application to a Raspberry Pi using Docker.

## Prerequisites

### On Your Local Machine
- Git installed
- SSH access to Raspberry Pi
- Bash shell (Linux/Mac/WSL)

### On Raspberry Pi
- Raspberry Pi with Raspbian/Raspberry Pi OS
- Network connectivity
- SSH enabled
- RS485 adapter connected

## Initial Setup

### 1. Setup SSH Key Authentication (Recommended)

To avoid typing password repeatedly:

```bash
ssh-copy-id pi@192.168.20.228
```

Enter the Pi's password when prompted. After this, you can SSH without a password.

### 2. Configure the Deployment Script

Edit `deploy.sh` and update the repository URL:

```bash
REPO_URL="https://github.com/YOUR_USERNAME/meter-mqtt.git"
```

Or if using SSH:
```bash
REPO_URL="git@github.com:YOUR_USERNAME/meter-mqtt.git"
```

### 3. Make the Script Executable

```bash
chmod +x deploy.sh
```

### 4. Configure Your Application

Edit `config.js` to match your Modbus device settings:
- Serial port (will be mapped in Docker)
- Baud rate
- Slave ID
- Register addresses

### 5. Configure Docker Compose

Edit `docker-compose.yml` if needed:
- Change `/dev/ttyUSB0` to match your RS485 adapter
- Adjust timezone if needed

## Deployment Commands

### Initial Deployment

Deploy for the first time:

```bash
./deploy.sh init
```

This will:
1. Connect to the Raspberry Pi via SSH
2. Install Docker if not present
3. Clone the repository (or copy files if clone fails)
4. Detect available serial ports
5. Build the Docker image
6. Start the container
7. Show logs

### Update Deployment

Update an existing deployment:

```bash
./deploy.sh update
```

This will:
1. Pull latest changes from Git
2. Rebuild the Docker image
3. Restart the container with new code
4. Show logs

### Other Commands

Show real-time logs:
```bash
./deploy.sh logs
```

Check application status:
```bash
./deploy.sh status
```

Start the application:
```bash
./deploy.sh start
```

Stop the application:
```bash
./deploy.sh stop
```

Restart the application:
```bash
./deploy.sh restart
```

## Manual Deployment (Alternative)

If you prefer to deploy manually:

### 1. SSH into Raspberry Pi

```bash
ssh pi@192.168.20.228
```

### 2. Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/meter-mqtt.git
cd meter-mqtt
```

### 3. Install Docker (if needed)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Log out and back in for group changes to take effect.

### 4. Configure Application

Edit `config.js` to match your setup:
```bash
nano config.js
```

### 5. Check Serial Port

Find your RS485 adapter:
```bash
ls /dev/ttyUSB* /dev/ttyAMA*
```

Update `docker-compose.yml` with the correct device path.

### 6. Build and Run

```bash
docker compose build
docker compose up -d
```

### 7. View Logs

```bash
docker compose logs -f
```

## Troubleshooting

### Serial Port Permission Issues

If you get permission errors accessing the serial port:

1. Add the Pi user to the dialout group:
```bash
sudo usermod -aG dialout pi
```

2. Or run container with privileged mode (already configured in docker-compose.yml)

### Docker Not Found After Installation

Log out and back in:
```bash
exit
ssh pi@192.168.20.228
```

### Container Keeps Restarting

Check the logs:
```bash
./deploy.sh logs
```

Common issues:
- Wrong serial port path
- Serial device not connected
- Configuration errors
- Modbus device not responding

### Cannot Connect to Pi

1. Check Pi is powered on and connected to network
2. Verify IP address: `ping 192.168.20.228`
3. Ensure SSH is enabled on the Pi
4. Try connecting manually: `ssh pi@192.168.20.228`

### Git Clone Fails

The script will automatically fall back to copying files via SCP if Git clone fails.

To use Git successfully:
1. Ensure Git is installed on Pi: `ssh pi@192.168.20.228 "sudo apt-get install -y git"`
2. For private repos, set up SSH keys or use HTTPS with credentials

## Configuration Management

### Updating Config Without Rebuild

You can update the configuration without rebuilding:

```bash
# Edit config on Pi
ssh pi@192.168.20.228
cd meter-mqtt
nano config.js

# Restart container
docker compose restart
```

### Environment Variables

You can override config values using environment variables in `docker-compose.yml`:

```yaml
environment:
  - MODBUS_SLAVE_ID=1
  - SERIAL_PORT=/dev/ttyUSB0
  - BAUD_RATE=9600
```

Then modify `config.js` to read from environment variables.

## Monitoring

### View Live Logs

```bash
./deploy.sh logs
```

### Check Container Status

```bash
./deploy.sh status
```

### SSH into Running Container

```bash
ssh pi@192.168.20.228
docker exec -it meter-mqtt sh
```

## Automatic Updates

To set up automatic updates using cron:

```bash
# On the Pi
crontab -e

# Add this line to update every day at 2 AM
0 2 * * * cd /home/pi/meter-mqtt && git pull && docker compose up -d --build
```

## Backup and Restore

### Backup Configuration

```bash
scp pi@192.168.20.228:/home/pi/meter-mqtt/config.js ./config.backup.js
```

### Restore Configuration

```bash
scp ./config.backup.js pi@192.168.20.228:/home/pi/meter-mqtt/config.js
ssh pi@192.168.20.228 "cd /home/pi/meter-mqtt && docker compose restart"
```

## Security Notes

1. Change default Pi password: `passwd`
2. Use SSH key authentication
3. Consider firewall rules: `sudo ufw enable`
4. Keep system updated: `sudo apt-get update && sudo apt-get upgrade`
5. Use environment variables for sensitive data
6. Don't commit sensitive configs to Git

## Performance Tips

1. Use `network_mode: host` in docker-compose.yml for better performance
2. Adjust polling interval in config.js based on your needs
3. Monitor system resources: `ssh pi@192.168.20.228 "htop"`
4. Clean up old Docker images: `docker system prune -a`

## Support

For issues or questions:
1. Check the logs: `./deploy.sh logs`
2. Verify configuration: `cat config.js`
3. Test serial connection manually
4. Check Modbus device documentation
