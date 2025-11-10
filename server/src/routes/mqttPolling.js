const express = require('express');
const router = express.Router();
const mqttPollingController = require('../controllers/mqttPollingController');

/**
 * POST /api/mqtt-polling/start/:type/:startAddress/:endAddress
 * Start MQTT polling loop for specific register range by type
 * Types: coils, input, holding, both
 * Examples: 
 *   POST /api/mqtt-polling/start/coils/604/610
 *   POST /api/mqtt-polling/start/input/604/610
 *   POST /api/mqtt-polling/start/holding/604/610
 *   POST /api/mqtt-polling/start/both/604/610
 * Optional body: { "interval": 5000, "deviceId": "device-1" }
 */
router.post('/start/:type/:startAddress/:endAddress', mqttPollingController.startMqttPolling);

/**
 * POST /api/mqtt-polling/stop
 * Stop the MQTT polling loop
 */
router.post('/stop', mqttPollingController.stopMqttPolling);

/**
 * GET /api/mqtt-polling/status
 * Get current MQTT polling status including MQTT connection status
 */
router.get('/status', mqttPollingController.getMqttPollingStatus);

/**
 * GET /api/mqtt-polling/logs
 * Get MQTT polling logs
 * Optional query: ?limit=50 (default: all logs)
 */
router.get('/logs', mqttPollingController.getMqttLogs);

/**
 * DELETE /api/mqtt-polling/logs
 * Clear all MQTT polling logs
 */
router.delete('/logs', mqttPollingController.clearMqttLogs);

/**
 * POST /api/mqtt-polling/publish
 * Manually publish data to MQTT topic
 * Required body: { "topic": "test/topic", "data": { "key": "value" } }
 * Optional body: { "options": { "qos": 1, "retain": false } }
 */
router.post('/publish', mqttPollingController.publishSingle);

/**
 * GET /api/mqtt-polling/connection
 * Get MQTT connection status
 */
router.get('/connection', mqttPollingController.getMqttConnection);

/**
 * POST /api/mqtt-polling/start-individual
 * Start individual register MQTT polling (fault tolerant)
 * Required body: { "registers": [300, 301, 302, 311, 312] }
 * Optional body: { "interval": 5000, "deviceId": "device-1" }
 */
router.post('/start-individual', mqttPollingController.startIndividualMqttPolling);

/**
 * POST /api/mqtt-polling/read-individual
 * Read individual registers once (testing endpoint)
 * Required body: { "registers": [300, 301, 302, 311, 312] }
 */
router.post('/read-individual', mqttPollingController.readIndividualRegistersOnce);

module.exports = router;