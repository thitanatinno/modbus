# Power Meter Dashboard

A React dashboard application for monitoring power meter data from a Modbus RS485 device.

## Features

- **Real-time Monitoring**: View live data from PV1 and PV2 solar panels
- **Power Metrics**: Monitor voltage, current, and power for each panel
- **Auto-refresh**: Automatic data polling every 5 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **Clean Architecture**: Following strict component separation patterns

## Power Meter Registers

The dashboard reads the following Modbus input registers:

| Register | Description | Unit |
|----------|-------------|------|
| 604 | PV1 Voltage | V |
| 605 | PV1 Current | A |
| 606 | PV1 Power | W |
| 610 | PV2 Voltage | V |
| 611 | PV2 Current | A |
| 612 | PV2 Power | W |

## Prerequisites

- Node.js (v14 or higher)
- Modbus API server running (from parent directory)
- Modern web browser

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint:
```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your API URL
# For local development:
REACT_APP_API_BASE_URL=http://localhost:3000

# For production (replace with your server IP):
REACT_APP_API_BASE_URL=http://192.168.20.228:3000
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3001` (or next available port).

### Production Build

Create an optimized production build:
```bash
npm run build
```

The build files will be in the `build/` directory.

### Production Deployment

Serve the production build:
```bash
npm install -g serve
serve -s build -p 3001
```

## Project Structure

```
power-meter-dashboard/
├── src/
│   ├── api/                    # API services
│   │   ├── axiosInstance.js   # Axios configuration
│   │   └── powerMeterService.js # Power meter API calls
│   ├── components/             # Reusable components
│   │   ├── common/            # Common components
│   │   │   ├── MeterCard/     # Meter display card
│   │   │   └── LoadingSpinner/ # Loading indicator
│   │   └── index.js           # Barrel exports
│   ├── pages/                  # Page components
│   │   └── Dashboard/         # Main dashboard page
│   │       ├── Dashboard.jsx
│   │       ├── useDashboard.js
│   │       ├── DashboardHandler.js
│   │       └── Dashboard.module.scss
│   ├── styles/                 # Global styles
│   │   ├── main.scss          # Main style entry
│   │   ├── _color.scss        # Color palette
│   │   ├── _font.scss         # Font system
│   │   └── _animation.scss    # Animations
│   ├── App.js                 # Root component
│   └── index.js               # App entry point
├── .env                        # Environment variables
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## Architecture

This project follows a strict 4-file component pattern:

1. **Component.jsx** - Presentation only
2. **useComponent.js** - State management (custom hook)
3. **ComponentHandler.js** - Business logic and event handlers
4. **Component.module.scss** - Scoped styles

### Styling System

- **Centralized SCSS**: All colors, fonts, and animations from global system
- **No hardcoded values**: Use mixins for colors, fonts, and animations
- **PascalCase classes**: CSS classes use PascalCase naming
- **Responsive**: Mobile-first responsive design

### API Integration

- **Centralized axios instance**: Single HTTP client with interceptors
- **Service layer**: Dedicated service files for API domains
- **Error handling**: Global and local error handling
- **Loading states**: Proper loading and error states

## Usage

1. **Start Monitoring**: Click "Start Monitoring" to begin polling the power meter
2. **View Data**: See real-time voltage, current, and power for PV1 and PV2
3. **Manual Refresh**: Click "Refresh Data" to manually update values
4. **Stop Monitoring**: Click "Stop Monitoring" to pause data updates

## API Configuration

The dashboard connects to the Modbus API server. Make sure:

1. The Modbus API server is running (from parent directory)
2. The API server is accessible at the configured URL
3. The API server is connected to the RS485 power meter

### Testing API Connection

Test the API manually:
```bash
# Health check
curl http://localhost:3000/health

# Start polling
curl -X POST http://localhost:3000/api/polling/start/input/604/612 \
  -H "Content-Type: application/json" \
  -d '{"interval": 5000}'

# Read data
curl http://localhost:3000/api/read/input/604/612
```

## Troubleshooting

### Cannot Connect to API

**Error**: "Failed to connect to power meter"

**Solutions**:
1. Check if API server is running: `curl http://localhost:3000/health`
2. Verify `.env` file has correct `REACT_APP_API_BASE_URL`
3. Check CORS settings on API server
4. Ensure firewall allows connections

### No Data Showing

**Issue**: Dashboard loads but shows zeros

**Solutions**:
1. Click "Start Monitoring" button
2. Check API logs for errors
3. Verify Modbus device is connected
4. Test API directly with curl

### CORS Errors

**Error**: "CORS policy blocked"

**Solution**: The React dev server uses proxy configuration. Make sure the API server allows CORS or use the proxy in package.json.

## Development

### Adding New Components

Follow the 4-file pattern:
```bash
src/components/common/NewComponent/
├── NewComponent.jsx
├── useNewComponent.js
├── NewComponentHandler.js
└── NewComponent.module.scss
```

### Styling Guidelines

Always use mixins from `src/styles/main`:
```scss
@import "src/styles/main";

.Container {
  @include bg-color-palette("white");
  @include text-color-palette("primary-color-1");
  @include font-size-palette("body-1");
}
```

Never use hardcoded values:
```scss
// ❌ Wrong
.Container {
  color: #206246;
  font-size: 16px;
}

// ✅ Correct
.Container {
  @include text-color-palette("primary-color-1");
  @include font-size-palette("body-1");
}
```

## License

ISC
