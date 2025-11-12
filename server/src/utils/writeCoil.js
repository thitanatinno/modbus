const { client } = require('./modbusClient');
const { getThaiTimestamp } = require('./dateUtils');

/**
 * Write single coil to Modbus device
 * @param {number} address - Coil address
 * @param {boolean} value - Value to write (true/false)
 * @returns {Promise<Object>} Object containing write result and metadata
 */
async function writeCoil(address, value) {
  try {
    await client.writeCoil(address, value);
    
    const timestamp = getThaiTimestamp();
    console.log(`[${timestamp}] Write coil successful:`);
    console.log(`  Address: ${address}`);
    console.log(`  Value: ${value}`);
    console.log('-----------------------------------\n');
    
    return {
      success: true,
      timestamp,
      address,
      value
    };
  } catch (error) {
    console.error('Write coil error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: getThaiTimestamp(),
      address,
      value
    };
  }
}

module.exports = writeCoil;
