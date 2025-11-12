const { client } = require('./modbusClient');
const { getThaiTimestamp } = require('./dateUtils');

/**
 * Read holding registers from Modbus device
 * @param {number} startAddress - Starting register address
 * @param {number} count - Number of registers to read
 * @returns {Promise<Object>} Object containing register values and metadata
 */
async function readHoldingRegisters(startAddress, count) {
  try {
    const data = await client.readHoldingRegisters(startAddress, count);
    
    const timestamp = getThaiTimestamp();
    console.log(`[${timestamp}] Read holding registers successful:`);
    console.log(`  Address Range: ${startAddress} - ${startAddress + count - 1}`);
    
    // Display individual register values
    data.data.forEach((value, index) => {
      const registerAddr = startAddress + index;
      console.log(`  Register ${registerAddr}: ${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`);
    });
    
    console.log('-----------------------------------\n');
    
    return {
      success: true,
      timestamp,
      startAddress,
      count,
      data: data.data
    };
  } catch (error) {
    console.error('Read holding registers error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: getThaiTimestamp(),
      startAddress,
      count
    };
  }
}

module.exports = readHoldingRegisters;
