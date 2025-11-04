const express = require('express');
const router = express.Router();
const readCoils = require('../utils/readCoils');
const { getLatestData } = require('../controllers/pollingController');

/**
 * GET /api/coils/latest
 * Get latest coils data from polling
 */
router.get('/latest', (req, res) => {
  try {
    const latestData = getLatestData();
    
    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: 'No data available. Start polling first.'
      });
    }
    
    res.json({
      success: true,
      data: latestData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving latest data',
      error: error.message
    });
  }
});

/**
 * GET /api/coils/read/:startAddress/:endAddress
 * Read coils from specific register range
 * Example: /api/coils/read/604/610
 */
router.get('/read/:startAddress/:endAddress', async (req, res) => {
  try {
    const startAddress = parseInt(req.params.startAddress);
    const endAddress = parseInt(req.params.endAddress);
    
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
    
    const count = endAddress - startAddress + 1;
    
    // Read the coils
    const result = await readCoils(startAddress, count);
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to read coils',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading coils',
      error: error.message
    });
  }
});

module.exports = router;
