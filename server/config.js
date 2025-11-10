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
  },

  // MQTT configuration
  mqtt: {
    host: process.env.MQTT_HOST || '139.59.245.155',
    port: parseInt(process.env.MQTT_PORT) || 1883,
    username: process.env.MQTT_USERNAME || 'root',
    password: process.env.MQTT_PASSWORD || 'DI#1nnov@tion',
    clientId: process.env.MQTT_CLIENT_ID || null, // Will auto-generate if null
    baseTopic: process.env.MQTT_BASE_TOPIC || 'hyxi_meter',
    qos: parseInt(process.env.MQTT_QOS) || 0,
    retain: process.env.MQTT_RETAIN === 'true' || false,
    connectTimeout: parseInt(process.env.MQTT_CONNECT_TIMEOUT) || 30000,
    reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD) || 1000,
    keepalive: parseInt(process.env.MQTT_KEEPALIVE) || 60
  }
};
