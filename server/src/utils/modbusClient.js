const ModbusRTU = require('modbus-serial');
const config = require('../../config');

// Create Modbus RTU client
const client = new ModbusRTU();

// Connect to RS485 serial port
async function connect() {
  try {
    console.log(`Connecting to ${config.serial.port}...`);
    
    await client.connectRTUBuffered(config.serial.port, {
      baudRate: config.serial.baudRate,
      dataBits: config.serial.dataBits,
      stopBits: config.serial.stopBits,
      parity: config.serial.parity
    });
    
    // Set Modbus slave ID
    client.setID(config.modbus.slaveId);
    
    // Set timeout
    client.setTimeout(config.modbus.timeout);
    
    console.log('Connected successfully!');
    console.log(`Reading from Slave ID: ${config.modbus.slaveId}`);
    
    return true;
  } catch (error) {
    console.error('Connection error:', error.message);
    return false;
  }
}

// Disconnect from serial port
function disconnect() {
  return new Promise((resolve) => {
    client.close(() => {
      console.log('Connection closed');
      resolve();
    });
  });
}

module.exports = {
  client,
  connect,
  disconnect
};
