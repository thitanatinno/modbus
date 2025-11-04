const express = require('express');
const router = express.Router();
const {
  startPolling,
  stopPolling,
  getPollingStatus,
  getLogs,
  clearLogs
} = require('../controllers/pollingController');

/**
 * POST /api/polling/start/:startAddress/:endAddress
 * Start polling loop for specific register range
 * Example: POST /api/polling/start/604/610
 * Optional body: { "interval": 5000, "type": "both" }
 * type can be: "input", "holding", or "both" (default: "both")
 */
router.post('/start/:startAddress/:endAddress', (req, res) => {
  try {
    const startAddress = parseInt(req.params.startAddress);
    const endAddress = parseInt(req.params.endAddress);
    const interval = req.body.interval ? parseInt(req.body.interval) : null;
    const type = req.body.type || 'both';
    
    // Validate parameters
    if (isNaN(startAddress) || isNaN(endAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid register addresses. Both must be numbers.'
      });
    }
    
    if (startAddress < 0 || endAddress < 0) {
      return res.status(400).json({
        success: false,
        message: 'Register addresses must be non-negative.'
      });
    }
    
    if (startAddress > endAddress) {
      return res.status(400).json({
        success: false,
        message: 'Start address must be less than or equal to end address.'
      });
    }
    
    if (interval && (isNaN(interval) || interval < 100)) {
      return res.status(400).json({
        success: false,
        message: 'Interval must be a number >= 100ms.'
      });
    }
    
    if (!['input', 'holding', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "input", "holding", or "both".'
      });
    }
    
    const result = startPolling(startAddress, endAddress, interval, type);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting polling',
      error: error.message
    });
  }
});

/**
 * POST /api/polling/stop
 * Stop the polling loop
 */
router.post('/stop', (req, res) => {
  try {
    const result = stopPolling();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error stopping polling',
      error: error.message
    });
  }
});

/**
 * GET /api/polling/status
 * Get current polling status
 */
router.get('/status', (req, res) => {
  try {
    const status = getPollingStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting polling status',
      error: error.message
    });
  }
});

/**
 * GET /api/polling/logs
 * Get real-time logs
 * Optional query: ?limit=50 (default: all logs)
 */
router.get('/logs', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const logs = getLogs(limit);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving logs',
      error: error.message
    });
  }
});

/**
 * DELETE /api/polling/logs
 * Clear all logs
 */
router.delete('/logs', (req, res) => {
  try {
    const result = clearLogs();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing logs',
      error: error.message
    });
  }
});

module.exports = router;
