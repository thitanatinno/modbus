# Client-Side Polling Flow

## Architecture Comparison

### Before (Server-Side Polling)
```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│         │  Start Polling   │         │   Background     │         │
│ Client  │─────────────────>│ Server  │   Interval       │ Modbus  │
│         │                   │         │─────────────────>│ Device  │
└─────────┘                   └─────────┘                  └─────────┘
     │                             │                             │
     │  Get Status (Cached)        │  Store in Memory            │
     │<────────────────────────────│<────────────────────────────│
     │                             │                             │
     │  Get Status (Cached)        │                             │
     │<────────────────────────────│                             │
     │                             │                             │
     
Problems:
- Server maintains state
- Cached data might be stale
- Complex coordination
- Memory overhead
```

### After (Client-Side Polling)
```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│         │                   │         │                   │         │
│ Client  │                   │ Server  │                   │ Modbus  │
│         │                   │         │                   │ Device  │
│         │                   │ (API)   │                   │         │
└─────────┘                   └─────────┘                   └─────────┘
     │                             │                             │
     │  setInterval (5s)           │                             │
     ├────────────────┐            │                             │
     │                │            │                             │
     │  Read Request  │            │                             │
     │────────────────┼───────────>│  Read Modbus               │
     │                │            │────────────────────────────>│
     │                │            │                             │
     │  Fresh Data    │            │  Response                   │
     │<───────────────┼────────────│<────────────────────────────│
     │                │            │                             │
     │  Update UI     │            │                             │
     │                │            │                             │
     │  Wait 5s...    │            │                             │
     │                │            │                             │
     │  Read Request  │            │                             │
     │────────────────┼───────────>│  Read Modbus               │
     │                │            │────────────────────────────>│
     
Benefits:
- No server state
- Always fresh data
- Stateless API
- Simple coordination
```

## Component Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Component                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Mount
                          ▼
                ┌──────────────────┐
                │  initialize()    │
                │  - Fetch data    │
                │  - Show loading  │
                └──────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  Data Loaded     │
                │  - Show dashboard│
                │  - Ready to poll │
                └──────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│ Start Monitoring │              │  Manual Refresh  │
└──────────────────┘              └──────────────────┘
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│ setInterval      │              │  fetchData()     │
│ Every 5 seconds  │              │  Single read     │
│                  │              └──────────────────┘
│  ┌───────────┐   │
│  │fetchData()│   │
│  └─────┬─────┘   │
│        │         │
│        ▼         │
│  ┌───────────┐   │
│  │ API Call  │   │
│  └─────┬─────┘   │
│        │         │
│        ▼         │
│  ┌───────────┐   │
│  │ Update UI │   │
│  └───────────┘   │
│        │         │
│        ▼         │
│  Wait 5s...      │
│  (repeat)        │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Stop Monitoring  │
│ clearInterval()  │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Component        │
│ Unmount          │
│                  │
│ cleanup()        │
│ - Stop polling   │
│ - Clear intervals│
└──────────────────┘
```

## Data Flow

```
User Action
    │
    ├─→ "Start Monitoring" clicked
    │       │
    │       ▼
    │   handleStartPolling()
    │       │
    │       ├─→ Set isPolling: true
    │       │
    │       ├─→ Initial fetchData()
    │       │       │
    │       │       ▼
    │       │   GET /api/read/input/604/615
    │       │       │
    │       │       ▼
    │       │   Server reads Modbus
    │       │       │
    │       │       ▼
    │       │   Parse registers
    │       │       │
    │       │       ▼
    │       │   Update state {pv1, pv2, totalPower}
    │       │
    │       └─→ setInterval(() => fetchData(), 5000)
    │               │
    │               └─→ Repeat every 5 seconds
    │
    ├─→ "Stop Monitoring" clicked
    │       │
    │       ▼
    │   handleStopPolling()
    │       │
    │       ├─→ clearInterval()
    │       │
    │       └─→ Set isPolling: false
    │
    └─→ "Refresh" clicked
            │
            ▼
        handleRefresh()
            │
            └─→ Single fetchData() call
```

## Register Parsing

```
API Response
    │
    └─→ { success: true, data: [604, 605, ..., 615] }
            │
            ▼
    parseRegisterData(data)
            │
            ├─→ Index 0 (Addr 604) → PV1 Voltage / 10
            │
            ├─→ Index 1 (Addr 605) → PV1 Current / 100
            │
            ├─→ Index 2 (Addr 606) → PV1 Power
            │
            ├─→ Index 6 (Addr 610) → PV2 Voltage / 10
            │
            ├─→ Index 7 (Addr 611) → PV2 Current / 100
            │
            ├─→ Index 8 (Addr 612) → PV2 Power
            │
            └─→ Calculate: totalPower = pv1Power + pv2Power
                    │
                    ▼
            setDashboard({
                pv1: { voltage, current, power },
                pv2: { voltage, current, power },
                totalPower,
                lastUpdate: new Date()
            })
                    │
                    ▼
            UI Updates (React re-render)
```

## Error Handling Flow

```
fetchData() call
    │
    ├─→ Success
    │       │
    │       └─→ parseRegisterData()
    │               │
    │               └─→ Update UI
    │
    └─→ Error
            │
            ├─→ Network Error
            │       │
            │       └─→ Set error: "Failed to connect..."
            │
            ├─→ API Error
            │       │
            │       └─→ Set error: response.data.message
            │
            └─→ Parsing Error
                    │
                    └─→ Log error, continue polling
```

## Memory Management

```
Component Lifecycle
    │
    ├─→ Mount
    │       │
    │       └─→ Create handler instance
    │               │
    │               └─→ Store interval ID
    │
    ├─→ Polling Active
    │       │
    │       └─→ Single interval running
    │               │
    │               └─→ Fetch data every 5s
    │
    └─→ Unmount
            │
            └─→ cleanup() called
                    │
                    ├─→ clearInterval(pollingIntervalId)
                    │
                    ├─→ clearInterval(window.dashboardPollingInterval)
                    │
                    └─→ No memory leaks ✓
```

## State Management

```
Initial State
    │
    ├─→ loading: true
    ├─→ isPolling: false
    ├─→ error: null
    ├─→ pv1: { voltage: "0.00", current: "0.00", power: "0.00" }
    ├─→ pv2: { voltage: "0.00", current: "0.00", power: "0.00" }
    ├─→ totalPower: "0.00"
    └─→ lastUpdate: "Not yet updated"
            │
            ▼
    initialize()
            │
            ▼
    First Data Fetch
            │
            ├─→ loading: false
            ├─→ pv1: { actual values }
            ├─→ pv2: { actual values }
            ├─→ totalPower: calculated
            └─→ lastUpdate: "10:30:45 AM"
                    │
                    ▼
    Start Polling
            │
            └─→ isPolling: true
                    │
                    ▼
            Data updates every 5s
                    │
                    ├─→ New values
                    └─→ Updated timestamp
```
