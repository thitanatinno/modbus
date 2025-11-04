const express = require('express');
const { connect, disconnect } = require('./src/utils/modbusClient');

// Import routes
const readRoutes = require('./src/routes/read');
const pollingRoutes = require('./src/routes/polling');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/read', readRoutes);
app.use('/api/polling', pollingRoutes);

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
      polling: {
        'POST /api/polling/start/:type/:startAddress/:endAddress': 'Start polling loop by type (coils, input, holding) - Optional body: {interval?: number}',
        'POST /api/polling/stop': 'Stop polling loop',
        'GET /api/polling/status': 'Get polling status',
        'GET /api/polling/logs': 'Get real-time logs (optional query: ?limit=50)',
        'DELETE /api/polling/logs': 'Clear all logs'
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
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnect();
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
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
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
