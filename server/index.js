const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connect, disconnect } = require('./src/utils/modbusClient');
const mqttClient = require('./src/utils/mqttClient');
const { autoStartInputRegisterPolling } = require('./src/controllers/mqttPollingController');

// Import routes
const readRoutes = require('./src/routes/read');
const writeRoutes = require('./src/routes/write');
const pollingRoutes = require('./src/routes/polling');
const mqttPollingRoutes = require('./src/routes/mqttPolling');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins (for development)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions)); // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/read', readRoutes);
app.use('/api/write', writeRoutes);
app.use('/api/polling', pollingRoutes);
app.use('/api/mqtt-polling', mqttPollingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Modbus RS485 API Server',
    version: '2.0.0',
    endpoints: {
      read: {
        'GET /api/read/:type/:startAddress/:endAddress': 'Read registers by type (coils, holding, input) from specific range (e.g., /api/read/input/604/610)'
      },
      write: {
        'POST /api/write/coil/:address': 'Write single coil - Body: { value: true/false }',
        'POST /api/write/coils/:startAddress': 'Write multiple coils - Body: { values: [true, false, ...] }',
        'POST /api/write/register/:address': 'Write single holding register - Body: { value: 0-65535 }',
        'POST /api/write/registers/:startAddress': 'Write multiple holding registers - Body: { values: [100, 200, ...] }'
      },
      polling: {
        'POST /api/polling/start/:type/:startAddress/:endAddress': 'Start polling loop by type (coils, input, holding) - Optional body: {interval?: number}',
        'POST /api/polling/stop': 'Stop polling loop',
        'GET /api/polling/status': 'Get polling status',
        'GET /api/polling/logs': 'Get real-time logs (optional query: ?limit=50)',
        'DELETE /api/polling/logs': 'Clear all logs'
      },
      'mqtt-polling': {
        'POST /api/mqtt-polling/start/:type/:startAddress/:endAddress': 'Start MQTT polling loop by type (coils, input, holding, both) - Optional body: {interval?: number, deviceId?: string}',
        'POST /api/mqtt-polling/start-individual': 'Start individual register MQTT polling (fault tolerant) - Body: {registers: [300,301,302], interval?: 5000, deviceId?: "device-1"}',
        'POST /api/mqtt-polling/read-individual': 'Read individual registers once (testing) - Body: {registers: [300,301,302]}',
        'POST /api/mqtt-polling/stop': 'Stop MQTT polling loop',
        'GET /api/mqtt-polling/status': 'Get MQTT polling and connection status',
        'GET /api/mqtt-polling/logs': 'Get MQTT polling logs (optional query: ?limit=50)',
        'DELETE /api/mqtt-polling/logs': 'Clear all MQTT logs',
        'POST /api/mqtt-polling/publish': 'Manually publish data to MQTT - Body: {topic: string, data: object, options?: object}',
        'GET /api/mqtt-polling/connection': 'Get MQTT connection status'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnect();
  await mqttClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnect();
  await mqttClient.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to Modbus device
    const connected = await connect();
    
    if (!connected) {
      console.error('Failed to connect to Modbus device. Please check your configuration and RS485 connection.');
      console.log('Server will start anyway, but Modbus operations will fail until connection is established.');
    }
    
    // Connect to MQTT broker
    const mqttConnected = await mqttClient.connect();
    
    if (!mqttConnected) {
      console.error('Failed to connect to MQTT broker. Please check your MQTT configuration.');
      console.log('Server will start anyway, but MQTT operations will fail until connection is established.');
    }
    
    // Auto-start MQTT polling if enabled and connections are ready
    if (config.autoStart.enabled && connected && mqttConnected) {
      console.log('Auto-starting MQTT polling for input registers...');
      const autoStartResult = await autoStartInputRegisterPolling(
        config.autoStart.registers,
        config.autoStart.interval,
        config.autoStart.deviceId
      );
      
      if (autoStartResult.success) {
        console.log('✅ MQTT polling started automatically');
        console.log(`📊 Reading registers: ${autoStartResult.config.registers.join(', ')}`);
        console.log(`📡 Publishing to MQTT every ${autoStartResult.config.interval}ms`);
        console.log(`🏷️ Device ID: ${autoStartResult.config.deviceId}`);
        console.log(`🔧 Mode: ${config.autoStart.individualReads ? 'Individual reads (fault tolerant)' : 'Batch reads (faster)'}`);
      } else {
        console.log('❌ Failed to auto-start MQTT polling:', autoStartResult.message);
      }
    } else if (!config.autoStart.enabled) {
      console.log('⚠️ Auto-start is disabled in configuration');
    } else {
      console.log('⚠️ Skipping auto-start due to connection issues');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`Modbus RS485 to MQTT API Server`);
      console.log(`========================================`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`Modbus: ${connected ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log(`MQTT: ${mqttConnected ? '🟢 Connected' : '🔴 Disconnected'}`);
      console.log(`Auto-polling: ${config.autoStart.enabled && connected && mqttConnected ? '🟢 Active' : '🔴 Inactive'}`);
      if (config.autoStart.enabled) {
        console.log(`📊 Registers: ${config.autoStart.registers.join(', ')}`);
        console.log(`⏱️ Interval: ${config.autoStart.interval}ms`);
        console.log(`🏷️ Device: ${config.autoStart.deviceId}`);
        console.log(`🔧 Read Mode: ${config.autoStart.individualReads ? 'Individual (fault tolerant)' : 'Batch (faster)'}`);
      }
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
startServer();

module.exports = app;
