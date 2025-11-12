const mqtt = require('mqtt');
const config = require('../../config');
const { getThaiTimestamp } = require('./dateUtils');

let client = null;
let isConnected = false;

/**
 * Connect to MQTT broker
 * @returns {Promise<boolean>} Connection success status
 */
async function connect() {
  try {
    if (client && isConnected) {
      console.log('MQTT client is already connected');
      return true;
    }

    const options = {
      host: config.mqtt.host,
      port: config.mqtt.port,
      username: config.mqtt.username || undefined,
      password: config.mqtt.password || undefined,
      clientId: config.mqtt.clientId || `meter-mqtt-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: config.mqtt.connectTimeout || 30000,
      reconnectPeriod: config.mqtt.reconnectPeriod || 1000,
      keepalive: config.mqtt.keepalive || 60
    };

    // Remove undefined values
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });

    console.log(`Connecting to MQTT broker at ${options.host}:${options.port}...`);
    
    client = mqtt.connect(options);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error('MQTT connection timeout');
        resolve(false);
      }, options.connectTimeout);

      client.on('connect', () => {
        clearTimeout(timeout);
        isConnected = true;
        console.log('Successfully connected to MQTT broker');
        resolve(true);
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        console.error('MQTT connection error:', error.message);
        isConnected = false;
        resolve(false);
      });

      client.on('disconnect', () => {
        console.log('MQTT client disconnected');
        isConnected = false;
      });

      client.on('offline', () => {
        console.log('MQTT client is offline');
        isConnected = false;
      });

      client.on('reconnect', () => {
        console.log('MQTT client attempting to reconnect...');
      });
    });
  } catch (error) {
    console.error('Error connecting to MQTT broker:', error.message);
    return false;
  }
}

/**
 * Disconnect from MQTT broker
 * @returns {Promise<void>}
 */
async function disconnect() {
  try {
    if (client && isConnected) {
      console.log('Disconnecting from MQTT broker...');
      await client.endAsync();
      client = null;
      isConnected = false;
      console.log('Successfully disconnected from MQTT broker');
    }
  } catch (error) {
    console.error('Error disconnecting from MQTT broker:', error.message);
  }
}

/**
 * Publish data to MQTT topic
 * @param {string} topic - MQTT topic
 * @param {object} data - Data to publish
 * @param {object} options - Publish options
 * @returns {Promise<object>} Publish result
 */
async function publish(topic, data, options = {}) {
  try {
    if (!client || !isConnected) {
      return {
        success: false,
        message: 'MQTT client is not connected'
      };
    }

    const payload = JSON.stringify({
      timestamp: getThaiTimestamp(),
      ...data
    });

    const publishOptions = {
      qos: options.qos || config.mqtt.qos || 0,
      retain: options.retain || config.mqtt.retain || false,
      ...options
    };

    return new Promise((resolve) => {
      client.publish(topic, payload, publishOptions, (error) => {
        if (error) {
          console.error(`Failed to publish to topic ${topic}:`, error.message);
          resolve({
            success: false,
            message: `Failed to publish to topic ${topic}`,
            error: error.message
          });
        } else {
          console.log(`Successfully published to topic ${topic}`);
          resolve({
            success: true,
            message: `Successfully published to topic ${topic}`,
            topic,
            payload,
            options: publishOptions
          });
        }
      });
    });
  } catch (error) {
    console.error('Error publishing to MQTT:', error.message);
    return {
      success: false,
      message: 'Error publishing to MQTT',
      error: error.message
    };
  }
}

/**
 * Publish modbus data to specific topics based on data type
 * @param {object} data - Modbus data object
 * @param {string} deviceId - Device identifier
 * @returns {Promise<object>} Publish result
 */
async function publishModbusData(data, deviceId = 'device-1') {
  try {
    const results = [];

    if (data.coils) {
      const coilTopic = `${config.mqtt.baseTopic}/${deviceId}/coils`;
      const coilResult = await publish(coilTopic, {
        type: 'coils',
        deviceId,
        data: data.coils
      });
      results.push({ topic: coilTopic, result: coilResult });
    }

    if (data.inputRegisters) {
      const inputTopic = `${config.mqtt.baseTopic}/${deviceId}/input-registers`;
      const inputResult = await publish(inputTopic, {
        type: 'input-registers',
        deviceId,
        data: data.inputRegisters
      });
      results.push({ topic: inputTopic, result: inputResult });
    }

    if (data.holdingRegisters) {
      const holdingTopic = `${config.mqtt.baseTopic}/${deviceId}/holding-registers`;
      const holdingResult = await publish(holdingTopic, {
        type: 'holding-registers',
        deviceId,
        data: data.holdingRegisters
      });
      results.push({ topic: holdingTopic, result: holdingResult });
    }

    const successCount = results.filter(r => r.result.success).length;
    const totalCount = results.length;

    return {
      success: successCount > 0,
      message: `Published ${successCount}/${totalCount} messages successfully`,
      deviceId,
      results
    };
  } catch (error) {
    console.error('Error publishing modbus data:', error.message);
    return {
      success: false,
      message: 'Error publishing modbus data',
      error: error.message
    };
  }
}

/**
 * Get MQTT connection status
 * @returns {object} Connection status
 */
function getStatus() {
  return {
    connected: isConnected,
    clientId: client ? client.options.clientId : null,
    host: config.mqtt.host,
    port: config.mqtt.port
  };
}

module.exports = {
  connect,
  disconnect,
  publish,
  publishModbusData,
  getStatus
};