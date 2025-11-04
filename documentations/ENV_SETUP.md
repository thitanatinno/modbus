# Environment Variables Setup

This project uses `.env` file for configuration management.

## Setup

1. The `.env` file contains all sensitive configuration including GitHub token
2. The `.env` file is in `.gitignore` (never committed to Git)
3. The `.env.example` file is committed as a template
4. The deployment script automatically uploads `.env` to the server

## Configuration Files

- **`.env`** - Actual configuration (NOT in Git, uploaded to server)
- **`.env.example`** - Template for reference (committed to Git)
- **`config.js`** - Reads from environment variables with fallback defaults
- **`docker-compose.yml`** - Loads `.env` file into container

## Environment Variables

### Deployment Configuration
```bash
GITHUB_TOKEN=your_github_token_here
REPO_URL=https://github.com/thitanatinno/modbus.git
PI_USER=pi
PI_HOST=192.168.20.228
APP_DIR=modbus
```

### Application Configuration
```bash
# Serial Port
SERIAL_PORT=/dev/ttyUSB0
BAUD_RATE=9600
DATA_BITS=8
STOP_BITS=1
PARITY=none

# Modbus
MODBUS_SLAVE_ID=1
MODBUS_TIMEOUT=1000
MODBUS_RETRIES=3

# Reading
REGISTER_ADDRESS=0
REGISTER_COUNT=10
POLLING_INTERVAL=5000

# Application
NODE_ENV=production
TZ=Asia/Bangkok
```

## Deployment Workflow

### Initial Deployment
```bash
./deploy.sh init
```

This will:
1. Load configuration from `.env`
2. SSH into Raspberry Pi
3. Clone repository using GitHub token from `.env`
4. Upload `.env` file to server
5. Build and start Docker container with environment variables

### Update Deployment
```bash
./deploy.sh update
```

This will:
1. Load configuration from `.env`
2. Pull latest code from Git
3. Upload latest `.env` file to server
4. Rebuild and restart container

## Security Notes

✅ **Good Practices:**
- `.env` is in `.gitignore` (never committed)
- GitHub token is stored in `.env` only
- `.env` is automatically uploaded during deployment
- Docker container loads `.env` file

⚠️ **Important:**
- Never commit `.env` to Git
- Keep `.env` file secure on your local machine
- Use `.env.example` as a template for team members
- Rotate GitHub token if compromised

## Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your values

3. Run locally:
```bash
npm install
npm start
```

Or with Docker:
```bash
docker compose up
```

## Changing Configuration

### On Local Machine
Edit `.env` file and redeploy:
```bash
./deploy.sh update
```

### On Server (Manual)
SSH into server and edit:
```bash
ssh pi@192.168.20.228
cd modbus
nano .env
docker compose restart
```

## Troubleshooting

### .env file not found
```bash
Error: .env file not found!
```
**Solution:** Create `.env` file from `.env.example`

### Environment variables not working
**Check:** Make sure `dotenv` is installed:
```bash
npm install dotenv
```

### .env not uploaded to server
**Check:** Deploy script output for .env upload status
**Solution:** Manually upload:
```bash
scp .env pi@192.168.20.228:/home/pi/modbus/.env
```

### Container not using new .env values
**Solution:** Restart container:
```bash
./deploy.sh restart
```
