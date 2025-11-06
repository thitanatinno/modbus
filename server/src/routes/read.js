const express = require('express');
const router = express.Router();
const readController = require('../controllers/readController');

/**
 * GET /api/read/:type/:startAddress/:endAddress
 * Read registers by type from specific register range
 * Types: coils, holding, input
 * Examples: 
 *   /api/read/coils/604/610
 *   /api/read/holding/604/610
 *   /api/read/input/604/610
 */
router.get('/:type/:startAddress/:endAddress', readController.readRegisters);

module.exports = router;
