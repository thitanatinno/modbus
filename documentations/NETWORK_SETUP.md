# Network Configuration Guide

## Port 3000 Access

The Modbus RS485 API server runs on **port 3000** and needs to be accessible from remote machines.

## Automatic Configuration

The deployment script (`deploy.sh`) now automatically:

1. ✅ **Configures firewall rules** for port 3000
2. ✅ **Checks if the API is accessible** from remote machines
3. ✅ **Provides the API URL** for testing

### Running Checks

```bash
# During deployment (automatic)
./deploy.sh init    # Checks during initial setup
./deploy.sh update  # Checks during updates
./deploy.sh restart # Checks after restart

# Manual check anytime
./deploy.sh check   # Only check firewall and API access
```

## What the Script Does

### 1. Firewall Configuration

The script checks for and configures:

- **UFW (Uncomplicated Firewall)** - If active, allows port 3000/tcp
- **iptables** - If UFW not found, adds iptables rule for port 3000

### 2. API Accessibility Check

The script performs multiple tests:

1. **Port Listening Check** - Verifies port 3000 is listening on the Raspberry Pi
2. **Localhost Test** - Tests API from within the Raspberry Pi (`curl http://localhost:3000/health`)
3. **Remote Access Test** - Tests API from your local machine (`curl http://<PI_IP>:3000/health`)

### 3. Results Display

After deployment, you'll see output like:

```
[INFO] Raspberry Pi IP: 192.168.1.100
[SUCCESS] ✅ API is accessible remotely from this machine!
[SUCCESS] API URL: http://192.168.1.100:3000

You can test the API with:
  curl http://192.168.1.100:3000/
  curl http://192.168.1.100:3000/health
  curl http://192.168.1.100:3000/api/coils/latest
```

## Docker Network Configuration

### Current Setup: Host Network Mode

The `docker-compose.yml` uses **`network_mode: host`** which means:

- ✅ Container shares the host's network stack
- ✅ Port 3000 is directly accessible on the Raspberry Pi
- ✅ No port mapping needed
- ✅ Better performance for serial device access
- ⚠️ Container has full network access (same as host)

### Alternative: Bridge Mode (Port Mapping)

If you prefer isolated networking, edit `docker-compose.yml`:

```yaml
# Comment out:
# network_mode: host

# Uncomment:
ports:
  - "3000:3000"
```

## Manual Firewall Configuration

If you need to manually configure the firewall:

### Using UFW (Ubuntu/Raspberry Pi OS)

```bash
# Check UFW status
sudo ufw status

# Allow port 3000
sudo ufw allow 3000/tcp

# Check rules
sudo ufw status numbered
```

### Using iptables

```bash
# Check current rules
sudo iptables -L -n

# Allow port 3000
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT

# Save rules (Debian/Raspberry Pi OS)
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

## Testing API Access

### From the Raspberry Pi (SSH)

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test root endpoint (API documentation)
curl http://localhost:3000/

# Check if port is listening
ss -tulpn | grep :3000
# or
netstat -tulpn | grep :3000
```

### From Your Local Machine

Replace `<PI_IP>` with your Raspberry Pi's IP address:

```bash
# Health check
curl http://<PI_IP>:3000/health

# API documentation
curl http://<PI_IP>:3000/

# Start polling
curl -X POST http://<PI_IP>:3000/api/polling/start/604/610 \
  -H "Content-Type: application/json" \
  -d '{"interval": 5000}'

# Get latest data
curl http://<PI_IP>:3000/api/coils/latest

# View logs
curl http://<PI_IP>:3000/api/polling/logs?limit=10
```

### From a Web Browser

Open these URLs in your browser:

- `http://<PI_IP>:3000/` - API documentation
- `http://<PI_IP>:3000/health` - Health check
- `http://<PI_IP>:3000/api/coils/latest` - Latest coil data

## Troubleshooting

### Port 3000 Not Accessible

1. **Check if application is running:**
   ```bash
   ./deploy.sh status
   ```

2. **Check if port is listening:**
   ```bash
   ssh pi@<PI_IP> "ss -tulpn | grep :3000"
   ```

3. **Check Docker container logs:**
   ```bash
   ./deploy.sh logs
   ```

4. **Verify firewall rules:**
   ```bash
   ssh pi@<PI_IP> "sudo ufw status"
   # or
   ssh pi@<PI_IP> "sudo iptables -L -n"
   ```

5. **Check Docker network configuration:**
   ```bash
   ssh pi@<PI_IP> "cd ~/meter-mqtt && docker compose ps"
   ssh pi@<PI_IP> "cd ~/meter-mqtt && docker compose exec meter-mqtt netstat -tulpn"
   ```

### Router/Network Firewall

If the API is accessible from the Raspberry Pi itself but not from other machines:

- Check your **router's firewall settings**
- Ensure the Raspberry Pi and your machine are on the **same local network**
- Some routers block inter-device communication (AP Isolation)
- Try accessing from another device on the same network

### Common Issues

#### Issue: "Connection refused"
**Solution:** Application may not be running
```bash
./deploy.sh start
```

#### Issue: "Connection timeout"
**Solution:** Firewall blocking or wrong IP
```bash
# Verify IP
ssh pi@<PI_IP> "hostname -I"

# Check firewall
./deploy.sh check
```

#### Issue: "Port already in use"
**Solution:** Another process using port 3000
```bash
ssh pi@<PI_IP> "sudo lsof -i :3000"
# or
ssh pi@<PI_IP> "sudo fuser 3000/tcp"
```

## Environment Variables

You can change the port by modifying the `index.js` file:

```javascript
const PORT = process.env.PORT || 3000;
```

To use a different port:

1. Edit `index.js` or add to `.env`:
   ```
   PORT=8080
   ```

2. Update firewall rules:
   ```bash
   sudo ufw allow 8080/tcp
   ```

3. Update `docker-compose.yml` if using bridge mode:
   ```yaml
   ports:
     - "8080:8080"
   ```

## Security Considerations

### Current Setup
- ⚠️ **No authentication** - API is publicly accessible
- ⚠️ **HTTP only** - No encryption
- ⚠️ **Host network mode** - Container has full network access

### Recommendations for Production

1. **Add Authentication:**
   - Implement API key or JWT authentication
   - Add middleware to verify tokens

2. **Use HTTPS:**
   - Set up reverse proxy (nginx) with SSL/TLS
   - Use Let's Encrypt for certificates

3. **Restrict Access:**
   - Use firewall rules to allow only specific IPs
   - Implement rate limiting
   - Use bridge network mode with specific port mapping

4. **Example with nginx reverse proxy:**
   ```nginx
   server {
       listen 443 ssl;
       server_name modbus.yourdomain.com;
       
       ssl_certificate /etc/ssl/certs/cert.pem;
       ssl_certificate_key /etc/ssl/private/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Summary

✅ **Port 3000** is automatically configured by the deployment script  
✅ **Firewall rules** are automatically added (UFW or iptables)  
✅ **Remote access** is automatically tested  
✅ Use **`./deploy.sh check`** anytime to verify configuration  
✅ API accessible at **`http://<PI_IP>:3000`**  

For issues, run `./deploy.sh check` and check the troubleshooting section above.
