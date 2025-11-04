const readCoils = require('../utils/readCoils');
const readHoldingRegisters = require('../utils/readHoldingRegisters');
const readInputRegisters = require('../utils/readInputRegisters');

/**
 * GET /api/read/:type/:startAddress/:endAddress
 * HTTP handler for reading registers by type
 * Types: coils, holding, input
 */
async function readRegisters(req, res) {
  try {
    const type = req.params.type;
    const startAddress = parseInt(req.params.startAddress);
    const endAddress = parseInt(req.params.endAddress);
    
    // Validate type
    if (!['coils', 'holding', 'input'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "coils", "holding", or "input".'
      });
    }
    
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
    let result;
    
    // Read based on type
    switch (type) {
      case 'coils':
        result = await readCoils(startAddress, count);
        break;
      case 'holding':
        result = await readHoldingRegisters(startAddress, count);
        break;
      case 'input':
        result = await readInputRegisters(startAddress, count);
        break;
    }
    
    if (result.success) {
      res.json({
        success: true,
        type,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to read ${type} registers`,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading registers',
      error: error.message
    });
  }
}

module.exports = {
  readRegisters
};
