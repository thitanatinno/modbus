# Project Structure

This project has been organized into a clean server/client architecture with Docker orchestration at the root level.

## 📁 Directory Structure

```
meter-mqtt/
├── server/                  # Backend API (Node.js + Modbus)
│   ├── src/                # Server source code
│   │   ├── controllers/   # API endpoint controllers
│   │   ├── routes/        # API route definitions
│   │   └── utils/         # Modbus utility functions
│   ├── index.js           # Main server entry point
│   ├── config.js          # Server configuration
│   ├── package.json       # Server dependencies
│   ├── Dockerfile         # Server Docker image
│   └── .env              # Server environment variables
│
├── client/                 # Frontend (React Dashboard)
│   ├── src/               # React source code
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API client services
│   │   └── styles/       # SCSS stylesheets
│   ├── public/            # Static assets
│   ├── package.json       # Client dependencies
│   └── README.md          # Client documentation
│
├── documentations/         # Project documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── ...
│
├── docker-compose.yml     # 🐳 Docker orchestration (ROOT LEVEL)
├── deploy.sh             # Production deployment script
├── dev.sh               # Development helper script
├── help.sh              # Command reference
├── test-deploy.sh       # Deployment testing
├── .env                 # Root environment variables
└── README.md            # Main project README
```

## 🐳 Docker Compose Location

**Important:** `docker-compose.yml` is at the **root level** for these reasons:

1. **Orchestrates multiple services** - Can manage both server and potential future services (client build, database, etc.)
2. **Single command deployment** - Run `docker compose up` from project root
3. **Standard practice** - Root-level docker-compose is the convention
4. **Easier CI/CD** - Simpler pipeline configuration

### Docker Compose Configuration

The docker-compose.yml references the server directory:

```yaml
services:
  meter-mqtt:
    build: ./server          # Build from server directory
    env_file:
      - ./server/.env        # Use server's environment file
    volumes:
      - ./server/config.js:/app/config.js:ro
      - ./server/logs:/app/logs
```

## 🚀 Quick Start

### Development Mode

**Option 1: Using dev.sh helper script**
```bash
# Install all dependencies
./dev.sh install

# Start server only
./dev.sh server

# Start client only
./dev.sh client

# Start both
./dev.sh both
```

**Option 2: Manual**
```bash
# Start server
cd server
npm install
npm start

# Start client (in new terminal)
cd client
npm install
npm start
```

### Production with Docker

From the **root directory**:

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild
docker compose build
```

### Remote Deployment

From the **root directory**:

```bash
# Initial deployment
./deploy.sh init

# Update deployment
./deploy.sh update

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Restart
./deploy.sh restart
```

## 📝 Environment Variables

### Server Environment (`server/.env`)
Required for the backend API:
```env
SERIAL_PORT=/dev/ttyUSB0
BAUD_RATE=9600
MODBUS_SLAVE_ID=1
PORT=3000
```

### Root Environment (`.env`)
Used for deployment scripts:
```env
PI_USER=pi
PI_HOST=192.168.20.228
PI_PASSWORD=your_password
APP_DIR=/home/pi/modbus
GITHUB_TOKEN=your_token
```

## 🔧 Key Files

### Root Level
- `docker-compose.yml` - Docker orchestration for all services
- `deploy.sh` - Automated deployment to Raspberry Pi
- `dev.sh` - Development helper commands
- `.env` - Deployment configuration

### Server (`/server`)
- `index.js` - Express API server
- `config.js` - Modbus configuration
- `Dockerfile` - Server container image
- `.env` - Server runtime configuration

### Client (`/client`)
- `src/App.js` - Main React application
- `src/api/` - Backend API client
- `package.json` - Frontend dependencies

## 📡 Ports

- **Server API**: `3000` (configurable via PORT env variable)
- **Client Dev Server**: `3001` (default React dev server port)
- **Production**: Both services can run on the same host with reverse proxy

## 🛠️ Common Tasks

### Adding New API Endpoint
1. Create controller in `server/src/controllers/`
2. Add route in `server/src/routes/`
3. Register route in `server/index.js`

### Adding New React Component
1. Create component in `client/src/components/`
2. Import and use in `client/src/pages/` or other components

### Updating Docker Configuration
1. Edit `docker-compose.yml` at root
2. Rebuild: `docker compose build`
3. Restart: `docker compose up -d`

### Deploying Changes
```bash
# Commit your changes
git add .
git commit -m "Your changes"
git push

# Deploy to production
./deploy.sh update
```

## 📚 Documentation

See the `/documentations` folder for detailed guides:
- API Documentation
- Architecture Overview
- Deployment Guide
- Environment Setup
- Network Configuration

## 🔍 Troubleshooting

### Docker Compose Not Found
Ensure you're running commands from the **root directory** (not `/server`):
```bash
cd /path/to/meter-mqtt
docker compose up
```

### Cannot Connect to API
1. Check server is running: `docker compose ps`
2. Check logs: `docker compose logs meter-mqtt`
3. Verify port 3000 is accessible: `curl http://localhost:3000/health`

### Client Can't Reach API
1. Check `client/src/config.js` - should point to `http://localhost:3000`
2. Update `client/.env` with `REACT_APP_API_BASE_URL=http://your-server:3000`

---

**Last Updated:** November 6, 2025  
**Structure Version:** 2.0 (Docker Compose at root)
