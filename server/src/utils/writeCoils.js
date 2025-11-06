const { client } = require('./modbusClient');

/**
 * Write multiple coils to Modbus device
 * @param {number} startAddress - Starting coil address
 * @param {Array<boolean>} values - Array of values to write (true/false)
 * @returns {Promise<Object>} Object containing write result and metadata
 */
async function writeCoils(startAddress, values) {
  try {
    await client.writeCoils(startAddress, values);
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Write multiple coils successful:`);
    console.log(`  Address Range: ${startAddress} - ${startAddress + values.length - 1}`);
    
    // Display individual coil values
    values.forEach((value, index) => {
      const coilAddr = startAddress + index;
      console.log(`  Coil ${coilAddr}: ${value}`);
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
    console.error('Write multiple coils error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      startAddress,
      count: values.length,
      values
    };
  }
}

module.exports = writeCoils;
