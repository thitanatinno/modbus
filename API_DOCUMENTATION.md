# Modbus RS485 API - Project Structure

## Overview
This project has been reorganized into a modular structure with separate controllers, utilities, and routes for better maintainability and scalability.

## Folder Structure

```
meter-mqtt/
├── src/
│   ├── controllers/
│   │   └── pollingController.js    # Manages polling loop and logs
│   ├── utils/
│   │   ├── modbusClient.js          # Modbus connection management
│   │   ├── readCoils.js             # Read coils function
│   │   ├── readInputRegisters.js    # Read input registers function (for future use)
│   │   └── readHoldingRegisters.js  # Read holding registers function (for future use)
│   └── routes/
│       ├── coils.js                 # Coils API endpoints
│       └── polling.js               # Polling control API endpoints
├── index.js                          # Express server entry point
├── index.old.js                      # Original implementation (backup)
├── config.js                         # Configuration file
└── package.json                      # Dependencies and scripts
```

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

## API Endpoints

### Root & Health Check

#### `GET /`
Returns API documentation with all available endpoints.

**Response:**
```json
{
  "message": "Modbus RS485 API Server",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

### Coils Endpoints

#### `GET /api/coils/latest`
Get the latest coils data from the polling loop.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "timestamp": "2025-11-04T10:30:00.000Z",
    "startAddress": 604,
    "count": 7,
    "data": [true, false, true, true, false, false, true]
  }
}
```

#### `GET /api/coils/read/:startAddress/:endAddress`
Read coils from a specific register range.

**Parameters:**
- `startAddress` - Starting register address (e.g., 604)
- `endAddress` - Ending register address (e.g., 610)

**Example:**
```
GET /api/coils/read/604/610
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "timestamp": "2025-11-04T10:30:00.000Z",
    "startAddress": 604,
    "count": 7,
    "data": [true, false, true, true, false, false, true]
  }
}
```

### Polling Control Endpoints

#### `POST /api/polling/start/:startAddress/:endAddress`
Start the polling loop for a specific register range.

**Parameters:**
- `startAddress` - Starting register address (e.g., 604)
- `endAddress` - Ending register address (e.g., 610)

**Optional Body:**
```json
{
  "interval": 5000
}
```

**Example:**
```
POST /api/polling/start/604/610
Content-Type: application/json

{
  "interval": 3000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Polling started successfully",
  "config": {
    "startAddress": 604,
    "endAddress": 610,
    "count": 7,
    "interval": 3000
  }
}
```

#### `POST /api/polling/stop`
Stop the current polling loop.

**Response:**
```json
{
  "success": true,
  "message": "Polling stopped successfully"
}
```

#### `GET /api/polling/status`
Get the current polling status.

**Response:**
```json
{
  "success": true,
  "status": {
    "isPolling": true,
    "latestData": { ... },
    "totalLogs": 45
  }
}
```

#### `GET /api/polling/logs`
Get real-time logs from the polling operations.

**Query Parameters:**
- `limit` (optional) - Number of recent logs to return (e.g., `?limit=50`)

**Example:**
```
GET /api/polling/logs?limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "logs": [
    {
      "timestamp": "2025-11-04T10:30:00.000Z",
      "type": "SUCCESS",
      "message": "Polled registers 604-610",
      "data": [true, false, true, true, false, false, true]
    },
    ...
  ]
}
```

#### `DELETE /api/polling/logs`
Clear all logs.

**Response:**
```json
{
  "success": true,
  "message": "Logs cleared successfully"
}
```

## Usage Examples

### Using cURL

Start polling registers 604-610:
```bash
curl -X POST http://localhost:3000/api/polling/start/604/610 \
  -H "Content-Type: application/json" \
  -d '{"interval": 5000}'
```

Read coils from registers 604-610:
```bash
curl http://localhost:3000/api/coils/read/604/610
```

Get latest data:
```bash
curl http://localhost:3000/api/coils/latest
```

View logs:
```bash
curl http://localhost:3000/api/polling/logs?limit=20
```

Stop polling:
```bash
curl -X POST http://localhost:3000/api/polling/stop
```

### Using Postman or Thunder Client

1. **Start Polling:**
   - Method: POST
   - URL: `http://localhost:3000/api/polling/start/604/610`
   - Body (JSON): `{"interval": 5000}`

2. **View Real-time Logs:**
   - Method: GET
   - URL: `http://localhost:3000/api/polling/logs`

3. **Get Latest Data:**
   - Method: GET
   - URL: `http://localhost:3000/api/coils/latest`

4. **Read Specific Range:**
   - Method: GET
   - URL: `http://localhost:3000/api/coils/read/604/610`

## Future Implementation

The following utilities are already created but not yet exposed via API:

- **readInputRegisters.js** - For reading input registers
- **readHoldingRegisters.js** - For reading holding registers

These can be implemented by creating similar route files as `coils.js`.

## Architecture Benefits

1. **Separation of Concerns:**
   - Utilities handle Modbus operations
   - Controllers manage business logic and state
   - Routes handle HTTP requests/responses

2. **Reusability:**
   - Utility functions can be used across different routes
   - Controller logic is independent of HTTP layer

3. **Maintainability:**
   - Easy to add new endpoints
   - Clear structure for debugging
   - Simple to test individual components

4. **Scalability:**
   - Easy to add support for input registers and holding registers
   - Can add more controllers for different polling strategies
   - Simple to add middleware for authentication, validation, etc.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (no data available)
- `500` - Internal Server Error

Error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```
