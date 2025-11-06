const writeCoil = require('../utils/writeCoil');
const writeCoils = require('../utils/writeCoils');
const writeRegister = require('../utils/writeRegister');
const writeRegisters = require('../utils/writeRegisters');

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const RETRY_DELAY_MS = 1000; // 1 second between retries

/**
 * Write with retry logic
 * @param {string} type - Type of write operation (coil, coils, register, registers)
 * @param {number} address - Starting address
 * @param {*} value - Value(s) to write
 * @returns {Promise<Object>} Result object
 */
async function writeWithRetry(type, address, value) {
  const startTime = Date.now();
  let attemptCount = 0;
  
  while (Date.now() - startTime < TIMEOUT_MS) {
    attemptCount++;
    let result;
    
    try {
      // Write based on type
      switch (type) {
        case 'coil':
          result = await writeCoil(address, value);
          break;
        case 'coils':
          result = await writeCoils(address, value);
          break;
        case 'register':
          result = await writeRegister(address, value);
          break;
        case 'registers':
          result = await writeRegisters(address, value);
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
      console.log(`[Attempt ${attemptCount}] Failed to write ${type}: ${result?.error || 'Unknown error'}`);
      
    } catch (error) {
      console.log(`[Attempt ${attemptCount}] Exception writing ${type}: ${error.message}`);
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
    error: 'Timeout: Failed to write after 2 minutes of retrying'
  };
}

/**
 * POST /api/write/coil/:address
 * HTTP handler for writing a single coil
 * Body: { value: true/false }
 */
async function writeSingleCoil(req, res) {
  try {
    const address = parseInt(req.params.address);
    const { value } = req.body;
    
    // Validate address
    if (isNaN(address) || address < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address. Must be a non-negative number.'
      });
    }
    
    // Validate value
    if (typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid value. Must be a boolean (true/false).'
      });
    }
    
    // Write with retry logic
    const result = await writeWithRetry('coil', address, value);
    
    if (result.success) {
      res.json({
        success: true,
        type: 'coil',
        attempts: result.attempts,
        data: result.data
      });
    } else {
      res.status(408).json({
        success: false,
        message: 'Failed to write coil',
        attempts: result.attempts,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error writing coil',
      error: error.message
    });
  }
}

/**
 * POST /api/write/coils/:startAddress
 * HTTP handler for writing multiple coils
 * Body: { values: [true, false, true, ...] }
 */
async function writeMultipleCoils(req, res) {
  try {
    const startAddress = parseInt(req.params.startAddress);
    const { values } = req.body;
    
    // Validate address
    if (isNaN(startAddress) || startAddress < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address. Must be a non-negative number.'
      });
    }
    
    // Validate values
    if (!Array.isArray(values) || values.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid values. Must be a non-empty array of booleans.'
      });
    }
    
    if (!values.every(v => typeof v === 'boolean')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid values. All elements must be booleans (true/false).'
      });
    }
    
    // Write with retry logic
    const result = await writeWithRetry('coils', startAddress, values);
    
    if (result.success) {
      res.json({
        success: true,
        type: 'coils',
        attempts: result.attempts,
        data: result.data
      });
    } else {
      res.status(408).json({
        success: false,
        message: 'Failed to write coils',
        attempts: result.attempts,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error writing coils',
      error: error.message
    });
  }
}

/**
 * POST /api/write/register/:address
 * HTTP handler for writing a single holding register
 * Body: { value: 0-65535 }
 */
async function writeSingleRegister(req, res) {
  try {
    const address = parseInt(req.params.address);
    const { value } = req.body;
    
    // Validate address
    if (isNaN(address) || address < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address. Must be a non-negative number.'
      });
    }
    
    // Validate value
    if (typeof value !== 'number' || isNaN(value)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid value. Must be a number.'
      });
    }
    
    if (value < 0 || value > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Invalid value. Must be between 0 and 65535.'
      });
    }
    
    // Write with retry logic
    const result = await writeWithRetry('register', address, value);
    
    if (result.success) {
      res.json({
        success: true,
        type: 'register',
        attempts: result.attempts,
        data: result.data
      });
    } else {
      res.status(408).json({
        success: false,
        message: 'Failed to write register',
        attempts: result.attempts,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error writing register',
      error: error.message
    });
  }
}

/**
 * POST /api/write/registers/:startAddress
 * HTTP handler for writing multiple holding registers
 * Body: { values: [100, 200, 300, ...] }
 */
async function writeMultipleRegisters(req, res) {
  try {
    const startAddress = parseInt(req.params.startAddress);
    const { values } = req.body;
    
    // Validate address
    if (isNaN(startAddress) || startAddress < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address. Must be a non-negative number.'
      });
    }
    
    // Validate values
    if (!Array.isArray(values) || values.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid values. Must be a non-empty array of numbers.'
      });
    }
    
    if (!values.every(v => typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 65535)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid values. All elements must be numbers between 0 and 65535.'
      });
    }
    
    // Write with retry logic
    const result = await writeWithRetry('registers', startAddress, values);
    
    if (result.success) {
      res.json({
        success: true,
        type: 'registers',
        attempts: result.attempts,
        data: result.data
      });
    } else {
      res.status(408).json({
        success: false,
        message: 'Failed to write registers',
        attempts: result.attempts,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error writing registers',
      error: error.message
    });
  }
}

module.exports = {
  writeSingleCoil,
  writeMultipleCoils,
  writeSingleRegister,
  writeMultipleRegisters
};
