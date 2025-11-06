# Power Meter Dashboard - Complete Guide

## Quick Start

### 1. Setup
```bash
cd power-meter-dashboard
./setup.sh
```

### 2. Configure API URL
Edit `.env` file:
```bash
REACT_APP_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm start
```

The dashboard will open at `http://localhost:3001`

---

## Project Overview

This is a React dashboard application built to monitor real-time power meter data from a Modbus RS485 device through the API server.

### Key Features

✅ **Real-time Data Monitoring**
- Live updates every 5 seconds
- PV1 and PV2 solar panel metrics
- Voltage, Current, and Power readings

✅ **Clean Architecture**
- Strict 4-file component pattern
- Separation of concerns (presentation, state, logic, styles)
- Centralized styling system with SCSS mixins

✅ **User-Friendly Interface**
- Start/Stop monitoring controls
- Manual refresh option
- Loading and error states
- Responsive design (mobile & desktop)

✅ **Robust API Integration**
- Axios-based HTTP client with interceptors
- Retry logic for failed requests
- Proper error handling

---

## Register Mapping

The dashboard reads input registers 604-612:

| Register | Parameter | Unit | Scale |
|----------|-----------|------|-------|
| 604 | PV1 Voltage | V | 0.1 |
| 605 | PV1 Current | A | 0.1 |
| 606 | PV1 Power | W | 1 |
| 607-609 | (Reserved) | - | - |
| 610 | PV2 Voltage | V | 0.1 |
| 611 | PV2 Current | A | 0.1 |
| 612 | PV2 Power | W | 1 |

---

## Architecture

### Component Structure (4-File Pattern)

Every component follows this mandatory structure:

```
ComponentName/
├── ComponentName.jsx          # Presentation (UI rendering)
├── useComponentName.js        # State management (React hooks)
├── ComponentNameHandler.js    # Business logic & event handlers
└── ComponentName.module.scss  # Scoped styles (SCSS modules)
```

### Example: MeterCard Component

```javascript
// MeterCard.jsx - Presentation only
import React from "react";
import styles from "./MeterCard.module.scss";
import useMeterCard from "./useMeterCard";
import MeterCardHandler from "./MeterCardHandler";

export default function MeterCard({ title, value, unit }) {
  const { stateMeterCard, setMeterCard } = useMeterCard({ title, value, unit });
  const handlers = MeterCardHandler(stateMeterCard, setMeterCard);
  
  return (
    <div className={styles.Container}>
      <h3>{stateMeterCard.title}</h3>
      <span>{stateMeterCard.value} {stateMeterCard.unit}</span>
    </div>
  );
}
```

```javascript
// useMeterCard.js - State management
import { useState } from "react";

const useMeterCard = (initialProps) => {
  const [stateMeterCard, setState] = useState({
    title: initialProps?.title || "",
    value: initialProps?.value || "0",
    unit: initialProps?.unit || "",
  });

  const setMeterCard = (field, value) => {
    if (typeof field === "object") {
      setState(prev => ({ ...prev, ...field }));
    } else {
      setState(prev => ({ ...prev, [field]: value }));
    }
  };

  return { stateMeterCard, setMeterCard };
};

export default useMeterCard;
```

```javascript
// MeterCardHandler.js - Business logic
const MeterCardHandler = (stateMeterCard, setMeterCard) => {
  return {
    handleUpdate: (newValue) => {
      setMeterCard("value", newValue);
    },
  };
};

export default MeterCardHandler;
```

```scss
// MeterCard.module.scss - Scoped styles
@import "src/styles/main";

.Container {
  @include bg-color-palette("white");
  @include text-color-palette("primary-color-1");
  @include font-size-palette("body-1");
  @include shawdow-palette("gray-400", 0.15);
  
  padding: 24px;
  border-radius: 12px;
}
```

---

## Styling System

### ❌ NEVER Do This (Hardcoded Values)

```scss
.Container {
  color: #206246;              // ❌ Hardcoded color
  font-size: 16px;             // ❌ Hardcoded font size
  background: #FFFFFF;         // ❌ Hardcoded background
  box-shadow: 0 2px 8px #ccc; // ❌ Hardcoded shadow
}
```

### ✅ ALWAYS Do This (Mixins)

```scss
@import "src/styles/main";

.Container {
  @include text-color-palette("primary-color-1");
  @include font-size-palette("body-1");
  @include bg-color-palette("white");
  @include shawdow-palette("gray-400", 0.2);
}
```

### Available Color Tokens

```scss
// Primary Colors
"primary-color-1"   // #206246 (Dark Green)
"primary-color-2"   // #11955E (Medium Green)
"primary-color-3"   // #45CE69 (Light Green)
"primary-color-4"   // #78D988 (Lightest Green)

// Secondary Colors
"secondary-color-1" // #DE5C8E (Dark Pink)
"secondary-color-2" // #E979A4 (Medium Pink)
"secondary-color-3" // #F798BD (Light Pink)
"secondary-color-4" // #F7B7CF (Lightest Pink)

// Activity Colors
"active-300", "active-200", "active-100"
"inactive", "warning"

// Basic Colors
"black", "white"
"gray-100" to "gray-900"
```

### Available Font Sizes

```scss
// Headlines
"headline-1"  // 46px
"headline-2"  // 36px
"headline-3"  // 24px
"headline-4"  // 22px
"headline-5"  // 18px

// Body
"body-1"      // 16px
"body-2"      // 14px
"body-3"      // 12px
"body-4"      // 10px
```

### Available Mixins

```scss
// Colors
@include text-color-palette("primary-color-1");
@include bg-color-palette("white");
@include border-color-palette("gray-300", 2px);
@include shawdow-palette("primary-color-1", 0.3);

// Typography
@include font-size-palette("headline-3");
@include font-weight(600);
@include font-family('Roboto', sans-serif);

// Animations
@include fade-in-animation(0.5s);
@include fade-out-animation(0.3s);
@include expand-animation(0.3s, 0, 100%);
@include shrink-animation(0.2s);
@include slide-in-left(0.4s);
@include slide-in-right(0.4s);
@include pulse-animation(1s);
```

---

## API Integration

### Service Layer

All API calls go through service files:

```javascript
// src/api/powerMeterService.js
import axiosInstance from "./axiosInstance";

export const readInputRegisters = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/input/${startAddress}/${endAddress}`);

export const startPolling = (type, startAddress, endAddress, interval) => 
  axiosInstance.post(`/api/polling/start/${type}/${startAddress}/${endAddress}`, { 
    interval 
  });
```

### Handler Implementation

API calls are made in handlers, never in components:

```javascript
// DashboardHandler.js
const DashboardHandler = (stateDashboard, setDashboard) => {
  const fetchData = async () => {
    try {
      setDashboard("loading", true);
      const response = await readInputRegisters(604, 612);
      
      if (response.data.success) {
        // Process data
        setDashboard({ data: response.data, loading: false });
      }
    } catch (error) {
      setDashboard({ error: error.message, loading: false });
    }
  };

  return { fetchData };
};
```

---

## Folder Structure

```
power-meter-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── axiosInstance.js        # Centralized HTTP client
│   │   └── powerMeterService.js    # API service functions
│   ├── components/
│   │   ├── common/                 # Reusable components
│   │   │   ├── MeterCard/
│   │   │   │   ├── MeterCard.jsx
│   │   │   │   ├── useMeterCard.js
│   │   │   │   ├── MeterCardHandler.js
│   │   │   │   └── MeterCard.module.scss
│   │   │   ├── LoadingSpinner/
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── useLoadingSpinner.js
│   │   │   │   ├── LoadingSpinnerHandler.js
│   │   │   │   └── LoadingSpinner.module.scss
│   │   │   └── index.js            # Barrel exports
│   │   └── index.js                # Main barrel export
│   ├── pages/
│   │   └── Dashboard/
│   │       ├── Dashboard.jsx
│   │       ├── useDashboard.js
│   │       ├── DashboardHandler.js
│   │       └── Dashboard.module.scss
│   ├── styles/
│   │   ├── main.scss               # Main entry point
│   │   ├── _color.scss             # Color system
│   │   ├── _font.scss              # Font system
│   │   └── _animation.scss         # Animation mixins
│   ├── App.js                      # Root component
│   ├── index.js                    # React entry point
│   └── config.js                   # App configuration
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── package.json                     # Dependencies
├── setup.sh                         # Setup script
└── README.md                        # Documentation
```

---

## Common Tasks

### Adding a New Component

1. Create folder structure:
```bash
mkdir -p src/components/common/NewComponent
```

2. Create 4 files:
```bash
touch src/components/common/NewComponent/NewComponent.jsx
touch src/components/common/NewComponent/useNewComponent.js
touch src/components/common/NewComponent/NewComponentHandler.js
touch src/components/common/NewComponent/NewComponent.module.scss
```

3. Update barrel export:
```javascript
// src/components/common/index.js
export { default as NewComponent } from './NewComponent/NewComponent';
```

### Connecting to Different API

Update `.env`:
```bash
REACT_APP_API_BASE_URL=http://192.168.20.228:3000
```

---

## Troubleshooting

### Issue: "Cannot connect to API"

**Check:**
1. Is the Modbus API server running? `curl http://localhost:3000/health`
2. Is `.env` configured correctly?
3. Is there a firewall blocking?

**Solution:**
```bash
cd ../  # Go to parent directory
npm start  # Start Modbus API server
```

### Issue: "CORS Error"

**Solution:** The `package.json` has proxy configured. For production, ensure API server allows CORS.

### Issue: "Data shows as 0"

**Check:**
1. Click "Start Monitoring" button
2. Check if Modbus device is connected
3. Test API: `curl http://localhost:3000/api/read/input/604/612`

---

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Serve the build:
```bash
npm install -g serve
serve -s build -p 80
```

3. Or use Nginx:
```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    
    root /path/to/power-meter-dashboard/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

---

## License

ISC
