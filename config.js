// Load environment variables from .env file if using dotenv
require('dotenv').config();

module.exports = {
  // Serial port configuration
  serial: {
    port: process.env.SERIAL_PORT || '/dev/ttyUSB0',
    baudRate: parseInt(process.env.BAUD_RATE) || 9600,
    dataBits: parseInt(process.env.DATA_BITS) || 8,
    stopBits: parseInt(process.env.STOP_BITS) || 1,
    parity: process.env.PARITY || 'none'
  },

  // Modbus configuration
  modbus: {
    slaveId: parseInt(process.env.MODBUS_SLAVE_ID) || 1,
    timeout: parseInt(process.env.MODBUS_TIMEOUT) || 1000,
    retries: parseInt(process.env.MODBUS_RETRIES) || 3
  },

  // Reading configuration
  reading: {
    registerAddress: parseInt(process.env.REGISTER_ADDRESS) || 0,
    registerCount: parseInt(process.env.REGISTER_COUNT) || 10,
    interval: parseInt(process.env.POLLING_INTERVAL) || 5000
  }
};
