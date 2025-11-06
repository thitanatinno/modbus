const express = require('express');
const router = express.Router();
const writeController = require('../controllers/writeController');

/**
 * POST /api/write/coil/:address
 * Write a single coil
 * Body: { value: true/false }
 * Example: POST /api/write/coil/604 with body { "value": true }
 */
router.post('/coil/:address', writeController.writeSingleCoil);

/**
 * POST /api/write/coils/:startAddress
 * Write multiple coils
 * Body: { values: [true, false, true, ...] }
 * Example: POST /api/write/coils/604 with body { "values": [true, false, true] }
 */
router.post('/coils/:startAddress', writeController.writeMultipleCoils);

/**
 * POST /api/write/register/:address
 * Write a single holding register
 * Body: { value: 0-65535 }
 * Example: POST /api/write/register/604 with body { "value": 1000 }
 */
router.post('/register/:address', writeController.writeSingleRegister);

/**
 * POST /api/write/registers/:startAddress
 * Write multiple holding registers
 * Body: { values: [100, 200, 300, ...] }
 * Example: POST /api/write/registers/604 with body { "values": [100, 200, 300] }
 */
router.post('/registers/:startAddress', writeController.writeMultipleRegisters);

module.exports = router;
