const { client } = require('./modbusClient');

/**
 * Write single holding register to Modbus device
 * @param {number} address - Register address
 * @param {number} value - Value to write (0-65535)
 * @returns {Promise<Object>} Object containing write result and metadata
 */
async function writeRegister(address, value) {
  try {
    await client.writeRegister(address, value);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Write register successful:`);
    console.log(`  Address: ${address}`);
    console.log(`  Value: ${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`);
    console.log('-----------------------------------\n');
    
    return {
      success: true,
      timestamp,
      address,
      value
    };
  } catch (error) {
    console.error('Write register error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      address,
      value
    };
  }
}

module.exports = writeRegister;
