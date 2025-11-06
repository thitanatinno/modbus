const readCoils = require('../utils/readCoils');
const readHoldingRegisters = require('../utils/readHoldingRegisters');
const readInputRegisters = require('../utils/readInputRegisters');

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const RETRY_DELAY_MS = 1000; // 1 second between retries
/**
 * Read registers with retry logic
 * @param {string} type - Type of register (coils, holding, input)
 * @param {number} startAddress - Starting address
 * @param {number} count - Number of registers to read
 * @returns {Promise<Object>} Result object
 */
async function readWithRetry(type, startAddress, count) {
  const startTime = Date.now();
  let attemptCount = 0; 
  while (Date.now() - startTime < TIMEOUT_MS) {
    attemptCount++;
    let result;    
    try {
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
      // Return immediately on first success
      if (result && result.success) {
        return {
          success: true,
          attempts: attemptCount,
          data: result
        };
      }
      
      // Log failure and retry
      console.log(`[Attempt ${attemptCount}] Failed to read ${type} registers ${startAddress}-${startAddress + count - 1}: ${result?.error || 'Unknown error'}`);
      
    } catch (error) {
      console.log(`[Attempt ${attemptCount}] Exception reading ${type} registers: ${error.message}`);
    }
    
    // Wait before next retry (don't wait after last attempt or if timeout is near)
    const remainingTime = TIMEOUT_MS - (Date.now() - startTime);
    if (remainingTime > RETRY_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  // Timeout reached
  return {
    success: false,
    attempts: attemptCount,
    error: 'Timeout: Failed to read registers after 2 minutes of retrying'
  };
}

/**
 * GET /api/read/:type/:startAddress/:endAddress
 * HTTP handler for reading registers by type
 * Types: coils, holding, input
 * Keeps retrying until first successful read or 2-minute timeout
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
    
    // Read with retry logic
    const result = await readWithRetry(type, startAddress, count);
    
    if (result.success) {
      res.json({
        success: true,
        type,
        attempts: result.attempts,
        data: result.data
      });
    } else {
      res.status(408).json({
        success: false,
        message: `Failed to read ${type} registers`,
        attempts: result.attempts,
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
