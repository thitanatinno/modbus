const { client } = require('./modbusClient');

/**
 * Read input registers from Modbus device
 * @param {number} startAddress - Starting register address
 * @param {number} count - Number of registers to read
 * @returns {Promise<Object>} Object containing register values and metadata
 */
async function readInputRegisters(startAddress, count) {
  try {
    const data = await client.readInputRegisters(startAddress, count);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Read input registers successful:`);
    console.log(`  Address Range: ${startAddress} - ${startAddress + count - 1}`);
    
    // Display individual register values
    data.data.forEach((value, index) => {
      const registerAddr = startAddress + index;
      console.log(`  Input Register ${registerAddr}: ${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`);
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
    console.error('Read input registers error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      startAddress,
      count
    };
  }
}

module.exports = readInputRegisters;
