const express = require('express');
const router = express.Router();
const pollingController = require('../controllers/pollingController');

/**
 * POST /api/polling/start/:type/:startAddress/:endAddress
 * Start polling loop for specific register range by type
 * Types: coils, input, holding
 * Examples: 
 *   POST /api/polling/start/coils/604/610
 *   POST /api/polling/start/input/604/610
 *   POST /api/polling/start/holding/604/610
 * Optional body: { "interval": 5000 }
 */
router.post('/start/:type/:startAddress/:endAddress', pollingController.startPolling);

/**
 * POST /api/polling/stop
 * Stop the polling loop
 */
router.post('/stop', pollingController.stopPolling);

/**
 * GET /api/polling/status
 * Get current polling status
 */
router.get('/status', pollingController.getPollingStatus);

/**
 * GET /api/polling/logs
 * Get real-time logs
 * Optional query: ?limit=50 (default: all logs)
 */
router.get('/logs', pollingController.getLogs);

/**
 * DELETE /api/polling/logs
 * Clear all logs
 */
router.delete('/logs', pollingController.clearLogs);

module.exports = router;
