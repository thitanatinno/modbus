const { client } = require('./modbusClient');
const { getThaiTimestamp } = require('./dateUtils');

/**
 * Write multiple holding registers to Modbus device
 * @param {number} startAddress - Starting register address
 * @param {Array<number>} values - Array of values to write (0-65535 each)
 * @returns {Promise<Object>} Object containing write result and metadata
 */
async function writeRegisters(startAddress, values) {
  try {
    await client.writeRegisters(startAddress, values);
    
    const timestamp = getThaiTimestamp();
    console.log(`[${timestamp}] Write multiple registers successful:`);
    console.log(`  Address Range: ${startAddress} - ${startAddress + values.length - 1}`);
    
    // Display individual register values
    values.forEach((value, index) => {
      const registerAddr = startAddress + index;
      console.log(`  Register ${registerAddr}: ${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`);
    });
    
    console.log('-----------------------------------\n');
    
    return {
      success: true,
      timestamp,
      startAddress,
      count: values.length,
      values
    };
  } catch (error) {
    console.error('Write multiple registers error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: getThaiTimestamp(),
      startAddress,
      count: values.length,
      values
    };
  }
}

module.exports = writeRegisters;
