# Dashboard Deployment Guide

## Overview

The React dashboard is now automatically built and deployed to the Raspberry Pi's nginx web server at `/var/www/html/dashboard`.

## Deployment Process

### Automatic Deployment

The dashboard is automatically built and deployed when you run:

```bash
# Full deployment (server + dashboard)
./deploy.sh init

# Update deployment (server + dashboard)
./deploy.sh update
```

### Dashboard Only Deployment

To deploy just the dashboard without touching the server:

```bash
./deploy.sh dashboard
```

## What Happens During Deployment

1. **Local Build**
   - Builds React app locally using `npm run build`
   - Creates optimized production build
   - Renames `build/` folder to `dashboard/`

2. **Server Preparation**
   - Installs nginx on Raspberry Pi (if not already installed)
   - Creates `/var/www/html` directory
   - Configures proper permissions

3. **File Transfer**
   - Copies dashboard files to `/tmp/dashboard` on Pi
   - Moves to final location `/var/www/html/dashboard`
   - Sets proper ownership (www-data:www-data)

4. **Firewall Configuration**
   - Opens port 80 (HTTP) for nginx
   - Opens port 3000 (API) for backend
   - Configures UFW or iptables as available

## Access URLs

After deployment, your application will be accessible at:

- **Dashboard (React App)**: `http://<raspberry-pi-ip>/dashboard`
- **API Server**: `http://<raspberry-pi-ip>:3000`

Example with IP 192.168.20.228:
- Dashboard: `http://192.168.20.228/dashboard`
- API: `http://192.168.20.228:3000`

## Configuration

### Homepage Setting

The client `package.json` includes:
```json
"homepage": "/dashboard"
```

This ensures all assets load correctly from the `/dashboard` subdirectory.

### API Proxy

During development, the proxy setting in `package.json` routes API calls:
```json
"proxy": "http://localhost:3000"
```

In production, update your `.env` to point to your Pi's IP:
```
REACT_APP_API_BASE_URL=http://192.168.20.228:3000
```

## Directory Structure on Pi

```
/var/www/html/
└── dashboard/
    ├── index.html
    ├── static/
    │   ├── css/
    │   ├── js/
    │   └── media/
    ├── manifest.json
    └── robots.txt
```

## Nginx Configuration

The default nginx configuration serves files from `/var/www/html`.

To customize nginx (optional):

```bash
# SSH into your Pi
ssh pi@192.168.20.228

# Edit nginx config
sudo nano /etc/nginx/sites-available/default
```

Example custom configuration:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm;

    server_name _;

    location /dashboard {
        alias /var/www/html/dashboard;
        try_files $uri $uri/ /dashboard/index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Dashboard Not Accessible

1. **Check nginx status**:
   ```bash
   ssh pi@<pi-ip> "sudo systemctl status nginx"
   ```

2. **Check file permissions**:
   ```bash
   ssh pi@<pi-ip> "ls -la /var/www/html/dashboard"
   ```

3. **Check firewall**:
   ```bash
   ssh pi@<pi-ip> "sudo ufw status"
   # or
   ssh pi@<pi-ip> "sudo iptables -L -n | grep 80"
   ```

### Build Fails

1. **Ensure Node.js is installed**:
   ```bash
   node --version
   npm --version
   ```

2. **Clean and rebuild**:
   ```bash
   cd client
   rm -rf node_modules build
   npm install
   npm run build
   ```

### API Connection Issues

1. **Check API is running**:
   ```bash
   curl http://<pi-ip>:3000/health
   ```

2. **Update client .env**:
   Create `client/.env`:
   ```
   REACT_APP_API_BASE_URL=http://<pi-ip>:3000
   ```

3. **Rebuild and redeploy**:
   ```bash
   ./deploy.sh dashboard
   ```

## Manual Deployment

If you need to manually deploy:

```bash
# 1. Build locally
cd client
npm run build

# 2. Rename folder
mv build dashboard

# 3. Copy to Pi
scp -r dashboard pi@<pi-ip>:/tmp/

# 4. Move to web directory
ssh pi@<pi-ip>
sudo mv /tmp/dashboard /var/www/html/
sudo chown -R www-data:www-data /var/www/html/dashboard
sudo chmod -R 755 /var/www/html/dashboard
```

## Development vs Production

### Development
```bash
cd client
npm start
# Access at http://localhost:3001
```

### Production
```bash
./deploy.sh dashboard
# Access at http://<pi-ip>/dashboard
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `./deploy.sh init` | Full initial deployment (server + dashboard) |
| `./deploy.sh update` | Update everything (server + dashboard) |
| `./deploy.sh dashboard` | Deploy only the dashboard |
| `./deploy.sh logs` | View server logs |
| `./deploy.sh status` | Check server status |
| `./deploy.sh restart` | Restart server |

## Notes

- Dashboard is built locally to avoid Node.js/npm issues on Pi
- Build process takes 30-60 seconds depending on your machine
- Dashboard is static files (no server-side rendering)
- API calls go directly to port 3000 (can be proxied through nginx)
- Deployment requires local Node.js installation
- Pi only needs nginx (no Node.js required for serving dashboard)
