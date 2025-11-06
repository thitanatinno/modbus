# Client-Side Polling Implementation

## Overview

The dashboard now uses **pure client-side polling** instead of relying on server-side polling endpoints. This provides:

- ✅ Better control over polling behavior
- ✅ Reduced server complexity
- ✅ Easier debugging and maintenance
- ✅ More predictable behavior
- ✅ Better error handling

## Architecture

### Old Approach (Server-Side Polling)
```
Client → Start Polling API → Server starts interval → Server polls Modbus
Client → Get Status API → Server returns cached data
```

### New Approach (Client-Side Polling)
```
Client → setInterval → Read API → Server reads Modbus → Client updates UI
```

## Implementation Details

### 1. Power Meter Service (`powerMeterService.js`)

Simplified API calls - removed server-side polling endpoints:

```javascript
// Core read functions
readInputRegisters(startAddress, endAddress)
readHoldingRegisters(startAddress, endAddress)
readCoils(startAddress, endAddress)
readDiscreteInputs(startAddress, endAddress)

// Write functions
writeSingleCoil(address, value)
writeSingleRegister(address, value)

// Health check
healthCheck()
```

### 2. Dashboard Handler (`DashboardHandler.js`)

#### Key Functions

**`fetchData(showLoading)`**
- Reads input registers 604-615 via `/api/read/input/604/615`
- Parses register data and updates state
- Handles errors gracefully
- `showLoading` controls whether to show loading indicator

**`handleStartPolling()`**
- Sets `isPolling: true`
- Performs initial data fetch
- Creates `setInterval` with configured interval (default: 5000ms)
- Stores interval ID for cleanup

**`handleStopPolling()`**
- Clears the polling interval
- Sets `isPolling: false`
- Cleans up global interval reference

**`handleRefresh()`**
- Manually triggers a single data fetch
- Only works when not actively polling

**`initialize()`**
- Called on component mount
- Performs initial data fetch to populate dashboard

**`cleanup()`**
- Called on component unmount
- Stops polling and clears intervals
- Prevents memory leaks

### 3. Register Mapping

Reading registers **604-615** from input registers:

| Index | Address | Parameter | Scale | Unit |
|-------|---------|-----------|-------|------|
| 0 | 604 | PV1 Voltage | 0.1 | V |
| 1 | 605 | PV1 Current | 0.01 | A |
| 2 | 606 | PV1 Power | 1 | W |
| 6 | 610 | PV2 Voltage | 0.1 | V |
| 7 | 611 | PV2 Current | 0.01 | A |
| 8 | 612 | PV2 Power | 1 | W |

### 4. Configuration

Polling interval is configured in `config.js`:

```javascript
{
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:3000",
  pollingInterval: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000
}
```

## Component Lifecycle

### Mount
1. Dashboard component mounts
2. `useEffect` calls `initialize()`
3. Initial data fetch populates dashboard
4. Loading state cleared

### Start Monitoring
1. User clicks "Start Monitoring"
2. `handleStartPolling()` called
3. Initial data fetch
4. `setInterval` starts with 5-second interval
5. Dashboard updates every 5 seconds

### Stop Monitoring
1. User clicks "Stop Monitoring"
2. `handleStopPolling()` called
3. Interval cleared
4. Dashboard stops updating

### Unmount
1. User navigates away
2. `useEffect` cleanup function runs
3. `cleanup()` called
4. All intervals cleared

## Error Handling

### Fetch Errors
- Logged to console
- Error message displayed to user
- Option to retry connection

### Polling Errors
- Logged to console (not displayed during active polling)
- Polling continues (non-blocking)
- User can manually refresh or restart polling

### Network Errors
- Caught and handled gracefully
- Clear error messages
- Retry button available

## Benefits Over Server-Side Polling

### 1. **Simplicity**
- No server state management
- No coordination between client and server
- Fewer API endpoints

### 2. **Reliability**
- No stale data from server cache
- Direct Modbus reads on each poll
- Fresh data guaranteed

### 3. **Flexibility**
- Easy to change polling interval
- Easy to add/remove data points
- Client controls timing

### 4. **Debugging**
- Clear flow: Client → API → Modbus → Response
- Network tab shows all requests
- Easy to see what's happening

### 5. **Scalability**
- Server doesn't maintain polling state
- No memory overhead on server
- Stateless API endpoints

## Usage

### Development

```bash
cd client
npm start
# Dashboard at http://localhost:3001
```

### Production

```bash
./deploy.sh dashboard
# Dashboard at http://<pi-ip>/dashboard
```

### Testing

1. Open dashboard
2. Click "Start Monitoring"
3. Observe data updating every 5 seconds
4. Open browser DevTools → Network tab
5. See `/api/read/input/604/615` requests every 5 seconds

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/read/input/:start/:end` | GET | Read input registers |
| `/api/read/holding/:start/:end` | GET | Read holding registers |
| `/api/read/coils/:start/:end` | GET | Read coils |
| `/api/read/discrete/:start/:end` | GET | Read discrete inputs |
| `/api/write/coil/:address` | POST | Write single coil |
| `/api/write/register/:address` | POST | Write single register |
| `/health` | GET | Health check |

## Configuration Options

### Polling Interval

Edit `client/src/config.js`:

```javascript
pollingInterval: 3000, // 3 seconds (faster)
pollingInterval: 10000, // 10 seconds (slower)
```

### Register Range

Edit `DashboardHandler.js`:

```javascript
// Current: reads 604-615
await readInputRegisters(604, 615);

// Custom: read different range
await readInputRegisters(600, 620);
```

### API Base URL

Create `client/.env`:

```
REACT_APP_API_BASE_URL=http://192.168.20.228:3000
```

## Migration Notes

### Removed Dependencies
- ❌ `/api/polling/start/*` - No longer needed
- ❌ `/api/polling/stop` - No longer needed
- ❌ `/api/polling/status` - No longer needed
- ❌ `/api/polling/logs` - No longer needed

### Server-Side Changes
- Server polling endpoints can be removed or kept for backward compatibility
- Only `/api/read/*` endpoints are required

### Client-Side Changes
- ✅ Simplified `powerMeterService.js`
- ✅ Refactored `DashboardHandler.js` for client-side polling
- ✅ Added lifecycle methods (`initialize`, `cleanup`)
- ✅ Improved error handling

## Performance Considerations

### Network Traffic
- 1 request every 5 seconds = 12 requests/minute
- ~720 requests/hour (if left running)
- Each request ~500 bytes = ~360 KB/hour

### Client Resources
- Minimal CPU usage
- Single interval timer
- No memory leaks (proper cleanup)

### Server Resources
- Stateless - no polling state
- Fresh Modbus reads on each request
- No background processes

## Future Enhancements

### Possible Improvements
1. **WebSocket Implementation** - Real-time updates without polling
2. **Adaptive Polling** - Adjust interval based on data changes
3. **Data Caching** - Reduce requests when data is stable
4. **Batch Reads** - Combine multiple register ranges
5. **Offline Mode** - Cache last known values

### WebSocket Example
```javascript
// Future: Real-time updates via WebSocket
const ws = new WebSocket('ws://pi-ip:3000/ws/meter');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  parseRegisterData(data);
};
```

## Troubleshooting

### Data Not Updating
1. Check if polling is active (green indicator)
2. Open DevTools → Network tab
3. Verify requests are being sent every 5 seconds
4. Check for error responses

### High CPU Usage
1. Verify polling interval isn't too short
2. Check for multiple polling intervals running
3. Ensure cleanup is working on unmount

### Stale Data
1. Client-side polling always fetches fresh data
2. No caching on client or server
3. Each poll reads directly from Modbus

### Memory Leaks
1. Ensure component unmounts properly
2. Check `cleanup()` is called
3. Verify no global intervals remain

## Summary

The refactored client-side polling implementation provides a simpler, more maintainable, and more reliable way to monitor Modbus data. By moving polling logic to the client, we eliminate server state complexity while maintaining full control over data refresh behavior.
