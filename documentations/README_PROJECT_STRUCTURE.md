# Project Structure

This project has been reorganized into a clear server/client architecture:

```
meter-mqtt/
├── server/              # Backend API (Node.js + Modbus)
│   ├── src/            # Server source code
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── utils/
│   ├── index.js        # Main server entry point
│   ├── config.js       # Server configuration
│   ├── package.json    # Server dependencies
│   ├── Dockerfile      # Server Docker configuration
│   └── docker-compose.yml
│
├── client/             # Frontend (React Dashboard)
│   ├── src/           # React source code
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── styles/
│   ├── public/
│   ├── package.json   # Client dependencies
│   └── README.md
│
├── documentations/     # Project documentation
├── deploy.sh          # Deployment script
└── README.md          # Main project README

```

## Folder Structure

### `/server` - Backend API
Contains the Node.js API server that communicates with Modbus devices over RS485.

**Key Files:**
- `index.js` - Main server entry point
- `config.js` - Modbus and server configuration
- `docker-compose.yml` - Docker setup for server
- `src/controllers/` - API endpoint controllers
- `src/routes/` - API route definitions
- `src/utils/` - Modbus utility functions

**To run the server:**
```bash
cd server
npm install
npm start
```

### `/client` - React Dashboard
Contains the React-based power meter dashboard for visualizing Modbus data.

**Key Files:**
- `src/App.js` - Main React app
- `src/pages/Dashboard/` - Dashboard page
- `src/components/` - Reusable React components
- `src/api/` - API client for backend communication

**To run the client:**
```bash
cd client
npm install
npm start
```

### `/documentations` - Project Docs
Comprehensive documentation for the entire project.

## Quick Start

### Development Mode

1. **Start the server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the client:**
   ```bash
   cd client
   npm install
   npm start
   ```

3. Open [http://localhost:3001](http://localhost:3001) to view the dashboard

### Production Deployment

Use the deployment script from the root directory:

```bash
# Initial deployment
./deploy.sh init

# Update existing deployment
./deploy.sh update

# View logs
./deploy.sh logs

# Check status
./deploy.sh status
```

## Migration Notes

The project structure has been reorganized for better separation of concerns:

- **Old:** All files in root directory
- **New:** Server files in `/server`, React app in `/client`

If you have existing deployments, you may need to:
1. Pull the latest changes
2. Re-run `./deploy.sh init` to set up the new structure on your Raspberry Pi

## Environment Variables

Server environment variables should be placed in `server/.env`
Client environment variables should be placed in `client/.env` (if needed)

See the documentation folder for detailed environment setup guides.
