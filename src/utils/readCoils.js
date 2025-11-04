const { client } = require('./modbusClient');
const config = require('../../config');

/**
 * Read coils (discrete outputs) from Modbus device
 * @param {number} startAddress - Starting register address
 * @param {number} count - Number of registers to read
 * @returns {Promise<Array>} Array of coil values (boolean)
 */
async function readCoils(startAddress, count) {
  try {
    // Ensure client is properly configured before reading
    if (client.isOpen) {
      client.setID(config.modbus.slaveId);
      client.setTimeout(config.modbus.timeout);
    }
    
    const data = await client.readCoils(startAddress, count);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Read coils successful:`);
    console.log(`  Address Range: ${startAddress} - ${startAddress + count - 1}`);
    console.log('  Coil values:', data.data);
    console.log('-----------------------------------\n');
    
    return {
      success: true,
      timestamp,
      startAddress,
      count,
      data: data.data
    };
  } catch (error) {
    console.error('Read coils error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      startAddress,
      count
    };
  }
}

module.exports = readCoils;
