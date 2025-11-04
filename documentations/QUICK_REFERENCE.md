# Quick Reference - API Endpoints

## Base URL
```
http://localhost:3000
```

## 📋 Coils Endpoints

### Get Latest Polling Data
```bash
GET /api/coils/latest
```

### Read Specific Register Range
```bash
GET /api/coils/read/{startAddress}/{endAddress}

# Example:
GET /api/coils/read/604/610
```

## 🔄 Polling Control Endpoints

### Start Polling
```bash
POST /api/polling/start/{startAddress}/{endAddress}
Content-Type: application/json

# Body (optional):
{
  "interval": 5000  # milliseconds
}

# Example:
POST /api/polling/start/604/610
```

### Stop Polling
```bash
POST /api/polling/stop
```

### Get Polling Status
```bash
GET /api/polling/status
```

### View Logs
```bash
GET /api/polling/logs?limit={number}

# Examples:
GET /api/polling/logs          # All logs
GET /api/polling/logs?limit=50 # Last 50 logs
```

### Clear Logs
```bash
DELETE /api/polling/logs
```

## 🏥 Utility Endpoints

### Health Check
```bash
GET /health
```

### API Documentation
```bash
GET /
```

---

## 📝 cURL Examples

```bash
# Start polling registers 604-610 every 3 seconds
curl -X POST http://localhost:3000/api/polling/start/604/610 \
  -H "Content-Type: application/json" \
  -d '{"interval": 3000}'

# View last 10 logs
curl http://localhost:3000/api/polling/logs?limit=10

# Get latest data
curl http://localhost:3000/api/coils/latest

# Read specific range on-demand
curl http://localhost:3000/api/coils/read/604/610

# Stop polling
curl -X POST http://localhost:3000/api/polling/stop

# Check server health
curl http://localhost:3000/health
```

## 📱 Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error"
}
```

### Polling Data Format
```json
{
  "success": true,
  "timestamp": "2025-11-04T10:30:00.000Z",
  "startAddress": 604,
  "count": 7,
  "data": [true, false, true, true, false, false, true]
}
```

### Log Entry Format
```json
{
  "timestamp": "2025-11-04T10:30:00.000Z",
  "type": "SUCCESS|ERROR|WARNING|INFO",
  "message": "Description",
  "data": [...]
}
```
