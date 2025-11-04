# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (HTTP)                          │
│                  (Browser, cURL, Postman, etc.)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        index.js (Server)                        │
│                      Express.js Application                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                       │ │
│  │  • JSON Parser                                            │ │
│  │  • URL Encoded Parser                                     │ │
│  │  • Request Logger                                         │ │
│  │  • Error Handler                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│   src/routes/    │           │   src/routes/    │
│    coils.js      │           │   polling.js     │
└────────┬─────────┘           └────────┬─────────┘
         │                               │
         │ Uses                          │ Uses
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────────────┐
│            src/controllers/                     │
│          pollingController.js                   │
│  ┌───────────────────────────────────────────┐  │
│  │  State Management:                        │  │
│  │  • pollingInterval                        │  │
│  │  • isPolling                              │  │
│  │  • latestData                             │  │
│  │  • logs (max 100 entries)                 │  │
│  │                                            │  │
│  │  Functions:                                │  │
│  │  • startPolling()                          │  │
│  │  • stopPolling()                           │  │
│  │  • getPollingStatus()                      │  │
│  │  • getLatestData()                         │  │
│  │  • getLogs()                               │  │
│  │  • clearLogs()                             │  │
│  └───────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ Calls
                     ▼
┌─────────────────────────────────────────────────┐
│              src/utils/                         │
│  ┌──────────────────────────────────────────┐   │
│  │       modbusClient.js                    │   │
│  │  • client (ModbusRTU instance)           │   │
│  │  • connect()                              │   │
│  │  • disconnect()                           │   │
│  └──────────────┬───────────────────────────┘   │
│                 │ Provides client to             │
│  ┌──────────────┴───────────────────────────┐   │
│  │         readCoils.js                     │   │
│  │  • Read discrete outputs                 │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │      readInputRegisters.js               │   │
│  │  • Read input registers (future)         │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │     readHoldingRegisters.js              │   │
│  │  • Read holding registers (future)       │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │ Serial Communication
                     ▼
┌─────────────────────────────────────────────────┐
│            RS485 / Modbus RTU Device            │
│              (Physical Hardware)                │
└─────────────────────────────────────────────────┘
```

## Request Flow Examples

### Example 1: Start Polling

```
Client
  │
  │ POST /api/polling/start/604/610
  ▼
Server (index.js)
  │
  │ Route to polling.js
  ▼
Routes (polling.js)
  │
  │ Validate params
  │ Call controller
  ▼
Controller (pollingController.js)
  │
  │ Create interval
  │ Call readCoils repeatedly
  ▼
Utils (readCoils.js)
  │
  │ Use modbusClient
  ▼
Modbus Client (modbusClient.js)
  │
  │ Serial communication
  ▼
RS485 Device
  │
  │ Return data
  ▼
... (Response flows back up)
```

### Example 2: Read Coils On-Demand

```
Client
  │
  │ GET /api/coils/read/604/610
  ▼
Server (index.js)
  │
  │ Route to coils.js
  ▼
Routes (coils.js)
  │
  │ Validate params
  │ Call readCoils directly
  ▼
Utils (readCoils.js)
  │
  │ Use modbusClient
  ▼
Modbus Client
  │
  │ Read from device
  ▼
RS485 Device
  │
  │ Return data
  ▼
... (Response flows back)
```

## Component Responsibilities

### 🎯 index.js (Server Entry Point)
- Initialize Express app
- Configure middleware
- Register routes
- Connect to Modbus device
- Handle graceful shutdown

### 🛣️ Routes (HTTP Interface)
**coils.js:**
- Handle coils-related HTTP requests
- Validate request parameters
- Call appropriate utilities or controller
- Format HTTP responses

**polling.js:**
- Handle polling control requests
- Manage start/stop operations
- Provide status and logs
- Format HTTP responses

### 🎮 Controllers (Business Logic)
**pollingController.js:**
- Manage polling state
- Control polling intervals
- Store and manage logs
- Provide data access methods

### 🔧 Utils (Core Functionality)
**modbusClient.js:**
- Manage Modbus connection
- Provide client instance
- Handle connection lifecycle

**readCoils.js:**
- Execute coil read operations
- Format response data
- Handle errors

**readInputRegisters.js:**
- Execute input register reads
- Ready for future implementation

**readHoldingRegisters.js:**
- Execute holding register reads
- Ready for future implementation

## Data Flow Patterns

### Pattern 1: Polling (Background Process)
```
Controller → Utils → Modbus Client → Device
     ▲                                   │
     └──────── Stores Result ────────────┘
```

### Pattern 2: On-Demand Read
```
Route → Utils → Modbus Client → Device
  ▲                                │
  └────── Returns Result ──────────┘
```

### Pattern 3: Get Latest Data
```
Route → Controller (returns cached data)
```

## Configuration Flow

```
config.js
   │
   ├─→ modbusClient.js (connection settings)
   │
   └─→ pollingController.js (default interval)
```

## Error Handling Layers

```
1. Modbus Client Level
   └─→ Connection errors, timeout errors
   
2. Util Function Level
   └─→ Read operation errors, validation errors
   
3. Controller Level
   └─→ State management errors, logic errors
   
4. Route Level
   └─→ HTTP validation errors, response formatting
   
5. Server Level (Express)
   └─→ Global error handler, 404 handler
```

## Scalability Considerations

### Easy to Add:
- ✅ New register types (input, holding)
- ✅ Multiple polling instances
- ✅ WebSocket support for real-time updates
- ✅ Authentication middleware
- ✅ Rate limiting
- ✅ Database persistence
- ✅ Caching layer
- ✅ Health monitoring

### Current Limits:
- Single polling instance at a time
- In-memory log storage (100 entries)
- Single Modbus connection

### Future Enhancements:
```
┌─────────────────────────┐
│   Load Balancer         │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼───┐      ┌────▼────┐
│Server1│      │ Server2 │
└───┬───┘      └────┬────┘
    │               │
    └───────┬───────┘
            │
    ┌───────▼────────┐
    │   Database     │
    │  (Historical)  │
    └────────────────┘
```
