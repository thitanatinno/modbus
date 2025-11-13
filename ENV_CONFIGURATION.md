# Environment Configuration

## Centralized Configuration

All environment variables (server and client) are now centralized in the root `.env` file.

### File Structure

```
hyxi-meter-mqtt/
├── .env                    # ✅ Single source of truth for all environment variables
├── .env.example            # ✅ Template for .env file
├── docker-compose.yml      # ✅ Injects variables from .env
├── server/
│   └── (uses env vars from root .env)
└── client/
    └── (uses REACT_APP_* from root .env)
```

### Environment Variables

#### Deployment Configuration
- `GITHUB_TOKEN` - GitHub personal access token
- `REPO_URL` - Repository URL
- `PI_USER`, `PI_PASSWORD`, `PI_HOST` - Raspberry Pi credentials
- `APP_DIR` - Application directory on server

#### Server Configuration
- `PORT=5000` - Server port
- `NODE_ENV` - Environment (development/production)
- `TZ` - Timezone

#### Client Configuration
- `REACT_APP_API_BASE_URL=http://localhost:5000` - API endpoint for React app

#### Serial Port Configuration
- `SERIAL_PORT`, `BAUD_RATE`, `DATA_BITS`, `STOP_BITS`, `PARITY`

#### Modbus Configuration
- `MODBUS_SLAVE_ID`, `MODBUS_TIMEOUT`, `MODBUS_RETRIES`

#### Reading Configuration
- `REGISTER_ADDRESS`, `REGISTER_COUNT`, `POLLING_INTERVAL`

#### MQTT Configuration
- `MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`
- `MQTT_CLIENT_ID`, `MQTT_BASE_TOPIC`, `MQTT_QOS`, `MQTT_RETAIN`
- `MQTT_CONNECT_TIMEOUT`, `MQTT_RECONNECT_PERIOD`, `MQTT_KEEPALIVE`

### How It Works

1. **Docker Compose**: Loads `.env` and injects variables into containers
   ```yaml
   build:
     context: ./server
     args:
       - REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
   env_file:
     - .env
   ```

2. **Development Script**: Exports variables before running client/server
   ```bash
   # dev.sh loads .env
   export $(cat .env | grep -v '^#' | xargs)
   ```

3. **Client Build**: Uses `REACT_APP_*` variables during build time
   - React automatically picks up `REACT_APP_*` prefixed variables
   - Falls back to default in `client/src/config.js`

4. **Deployment**: `.env` is copied to server and used for both builds and runtime

### Usage

#### Local Development
```bash
# Start server (uses PORT, MQTT_*, etc. from .env)
./dev.sh server

# Start client (uses REACT_APP_API_BASE_URL from .env)
./dev.sh client

# Start both
./dev.sh both
```

#### Docker
```bash
# Docker Compose automatically loads .env
docker-compose up --build
```

#### Production Deployment
```bash
# Deployment script uses .env for builds and deployment
./deploy.sh init     # Initial deployment
./deploy.sh update   # Update deployment
```

### Important Notes

1. **Never commit `.env`** - It's in `.gitignore`
2. **Use `.env.example`** as template for new environments
3. **Client variables must have `REACT_APP_` prefix** to be used by React
4. **Update both projects** when changing shared variables (MQTT, etc.)
5. **Production URLs**: Change `REACT_APP_API_BASE_URL` to actual server IP for deployment
