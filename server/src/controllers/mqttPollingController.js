const readCoils = require('../utils/readCoils');
const readInputRegisters = require('../utils/readInputRegisters');
const readHoldingRegisters = require('../utils/readHoldingRegisters');
const mqttClient = require('../utils/mqttClient');
const config = require('../../config');

// State management for MQTT polling
let mqttPollingInterval = null;
let isMqttPolling = false;
let latestMqttData = {
  coils: null,
  inputRegisters: null,
  holdingRegisters: null
};
let mqttLogs = [];
const MAX_MQTT_LOGS = 100;

function addMqttLog(type, message, data = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    data
  };
  
  mqttLogs.push(logEntry);
  
  if (mqttLogs.length > MAX_MQTT_LOGS) {
    mqttLogs = mqttLogs.slice(-MAX_MQTT_LOGS);
  }
  
  console.log(`[MQTT] [${logEntry.timestamp}] [${type}] ${message}`);
}

function startMqttPollingLoop(startAddress, endAddress, interval = null, type = 'both', deviceId = 'device-1') {
  if (isMqttPolling) {
    addMqttLog('WARNING', 'MQTT polling is already running');
    return {
      success: false,
      message: 'MQTT polling is already running',
      currentConfig: {
        startAddress,
        endAddress,
        count: endAddress - startAddress + 1,
        type,
        deviceId
      }
    };
  }
  
  const count = endAddress - startAddress + 1;
  const pollInterval = interval || config.reading.interval || 5000;
  
  addMqttLog('INFO', `Starting MQTT polling loop: Register ${startAddress}-${endAddress} (count: ${count}), type: ${type}, device: ${deviceId}, interval: ${pollInterval}ms`);
  
  const mqttPoll = async () => {
    try {
      const results = {};
      let hasData = false;
      
      if (type === 'coils' || type === 'both') {
        const coilResult = await readCoils(startAddress, count);
        results.coils = coilResult;
        latestMqttData.coils = coilResult;
        
        if (coilResult.success) {
          addMqttLog('SUCCESS', `Polled coils ${startAddress}-${endAddress} for MQTT`, coilResult.data);
          hasData = true;
        } else {
          addMqttLog('ERROR', `Failed to poll coils ${startAddress}-${endAddress} for MQTT`, coilResult.error);
        }
      }
      
      if (type === 'input' || type === 'both') {
        const inputResult = await readInputRegisters(startAddress, count);
        results.inputRegisters = inputResult;
        latestMqttData.inputRegisters = inputResult;
        
        if (inputResult.success) {
          addMqttLog('SUCCESS', `Polled input registers ${startAddress}-${endAddress} for MQTT`, inputResult.data);
          hasData = true;
        } else {
          addMqttLog('ERROR', `Failed to poll input registers ${startAddress}-${endAddress} for MQTT`, inputResult.error);
        }
      }
      
      if (type === 'holding' || type === 'both') {
        const holdingResult = await readHoldingRegisters(startAddress, count);
        results.holdingRegisters = holdingResult;
        latestMqttData.holdingRegisters = holdingResult;
        
        if (holdingResult.success) {
          addMqttLog('SUCCESS', `Polled holding registers ${startAddress}-${endAddress} for MQTT`, holdingResult.data);
          hasData = true;
        } else {
          addMqttLog('ERROR', `Failed to poll holding registers ${startAddress}-${endAddress} for MQTT`, holdingResult.error);
        }
      }
      
      // Publish to MQTT if we have data
      if (hasData) {
        const publishResult = await mqttClient.publishModbusData(results, deviceId);
        if (publishResult.success) {
          addMqttLog('SUCCESS', `Published data to MQTT for device ${deviceId}`, publishResult);
        } else {
          addMqttLog('ERROR', `Failed to publish data to MQTT for device ${deviceId}`, publishResult.error);
        }
      }
      
    } catch (error) {
      addMqttLog('ERROR', `MQTT polling error: ${error.message}`);
    }
  };
  
  // Run initial poll
  mqttPoll();
  
  mqttPollingInterval = setInterval(mqttPoll, pollInterval);
  isMqttPolling = true;
  
  return {
    success: true,
    message: 'MQTT polling started successfully',
    config: {
      startAddress,
      endAddress,
      count,
      type,
      deviceId,
      interval: pollInterval
    }
  };
}

function stopMqttPollingLoop() {
  if (!isMqttPolling) {
    addMqttLog('WARNING', 'MQTT polling is not running');
    return {
      success: false,
      message: 'MQTT polling is not running'
    };
  }
  
  clearInterval(mqttPollingInterval);
  mqttPollingInterval = null;
  isMqttPolling = false;
  
  addMqttLog('INFO', 'MQTT polling stopped');
  
  return {
    success: true,
    message: 'MQTT polling stopped successfully'
  };
}

function getMqttStatus() {
  const mqttStatus = mqttClient.getStatus();
  
  return {
    isMqttPolling,
    mqttConnection: mqttStatus,
    latestData: latestMqttData,
    totalLogs: mqttLogs.length
  };
}

function getLatestMqttData() {
  return latestMqttData;
}

/**
 * Read individual input registers with error handling
 * @param {Array} registers - Array of register addresses to read
 * @returns {Promise<object>} Read results with individual register status
 */
async function readIndividualInputRegisters(registers) {
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    registers: {},
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (const registerAddr of registers) {
    try {
      const data = await readInputRegisters(registerAddr, 1);
      if (data.success && data.data && data.data.length > 0) {
        results.registers[registerAddr] = {
          success: true,
          value: data.data[0],
          timestamp: data.timestamp
        };
        results.successCount++;
      } else {
        results.registers[registerAddr] = {
          success: false,
          error: data.error || 'No data returned',
          timestamp: data.timestamp
        };
        results.failureCount++;
        results.errors.push(`Register ${registerAddr}: ${data.error || 'No data returned'}`);
      }
    } catch (error) {
      results.registers[registerAddr] = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      results.failureCount++;
      results.errors.push(`Register ${registerAddr}: ${error.message}`);
    }
  }

  // Overall success if at least one register was read successfully
  results.success = results.successCount > 0;
  
  return results;
}

/**
 * Auto-start MQTT polling for specific input registers with individual error handling
 * @param {Array} registers - Array of register addresses to read
 * @param {number} interval - Polling interval in milliseconds
 * @param {string} deviceId - Device identifier
 * @returns {Promise<object>} Operation result
 */
async function autoStartInputRegisterPolling(registers = [300,301,302,311,312,313,316,317,406,604,605,606,610,611,612], interval = 5000, deviceId = 'device-1') {
  try {
    if (isMqttPolling) {
      addMqttLog('WARNING', 'MQTT polling is already running - skipping auto-start');
      return {
        success: false,
        message: 'MQTT polling is already running'
      };
    }

    // Check MQTT connection first
    const mqttStatus = mqttClient.getStatus();
    if (!mqttStatus.connected) {
      // Try to connect to MQTT
      const connected = await mqttClient.connect();
      if (!connected) {
        addMqttLog('ERROR', 'Failed to connect to MQTT broker for auto-start');
        return {
          success: false,
          message: 'Failed to connect to MQTT broker'
        };
      }
    }

    addMqttLog('INFO', `Auto-starting MQTT polling for individual input registers: ${registers.join(', ')}`);
    addMqttLog('INFO', `Using individual register reads to handle partial failures gracefully`);
    
    // Start individual register polling
    const result = startIndividualRegisterPolling(registers, interval, deviceId);
    
    if (result.success) {
      addMqttLog('SUCCESS', `Auto-started individual register MQTT polling successfully`);
      return {
        success: true,
        message: 'Auto-started MQTT polling for individual input registers',
        config: {
          registers: registers,
          type: 'input-individual',
          deviceId,
          interval,
          totalRegisters: registers.length
        }
      };
    } else {
      addMqttLog('ERROR', `Failed to auto-start individual register MQTT polling: ${result.message}`);
      return result;
    }
  } catch (error) {
    addMqttLog('ERROR', `Error in auto-start individual register MQTT polling: ${error.message}`);
    return {
      success: false,
      message: 'Error in auto-start individual register MQTT polling',
      error: error.message
    };
  }
}

/**
 * Start individual register polling loop
 * @param {Array} registers - Array of register addresses
 * @param {number} interval - Polling interval in milliseconds  
 * @param {string} deviceId - Device identifier
 * @returns {object} Operation result
 */
function startIndividualRegisterPolling(registers, interval = 5000, deviceId = 'device-1') {
  if (isMqttPolling) {
    return {
      success: false,
      message: 'MQTT polling is already running'
    };
  }

  addMqttLog('INFO', `Starting individual register polling: ${registers.length} registers, device: ${deviceId}, interval: ${interval}ms`);
  
  const individualPoll = async () => {
    try {
      const results = await readIndividualInputRegisters(registers);
      
      if (results.successCount > 0) {
        // Create data structure for MQTT publishing
        const mqttData = {
          inputRegisters: {
            success: true,
            data: results.registers,
            successCount: results.successCount,
            failureCount: results.failureCount,
            totalRegisters: registers.length,
            timestamp: results.timestamp,
            startAddress: Math.min(...registers),
            count: registers.length
          }
        };

        // Publish to MQTT
        const publishResult = await mqttClient.publishModbusData(mqttData, deviceId);
        if (publishResult.success) {
          addMqttLog('SUCCESS', `Published individual register data to MQTT for device ${deviceId} (${results.successCount}/${registers.length} registers successful)`, {
            successCount: results.successCount,
            failureCount: results.failureCount,
            errors: results.errors
          });
        } else {
          addMqttLog('ERROR', `Failed to publish individual register data to MQTT for device ${deviceId}`, publishResult.error);
        }
      } else {
        addMqttLog('ERROR', `All individual register reads failed for device ${deviceId}`, results.errors);
      }
      
    } catch (error) {
      addMqttLog('ERROR', `Individual register polling error: ${error.message}`);
    }
  };
  
  // Run initial poll
  individualPoll();
  
  mqttPollingInterval = setInterval(individualPoll, interval);
  isMqttPolling = true;
  
  return {
    success: true,
    message: 'Individual register MQTT polling started successfully',
    config: {
      registers,
      deviceId,
      interval,
      totalRegisters: registers.length
    }
  };
}

function getMqttLogsData(limit = null) {
  if (limit && limit > 0) {
    return mqttLogs.slice(-limit);
  }
  return mqttLogs;
}

function clearMqttLogsData() {
  mqttLogs = [];
  addMqttLog('INFO', 'MQTT logs cleared');
  return {
    success: true,
    message: 'MQTT logs cleared successfully'
  };
}

async function startMqttPolling(req, res) {
  try {
    const type = req.params.type;
    const startAddress = parseInt(req.params.startAddress);
    const endAddress = parseInt(req.params.endAddress);
    const interval = req.body.interval ? parseInt(req.body.interval) : null;
    const deviceId = req.body.deviceId || 'device-1';
    
    // Validate type
    if (!['coils', 'input', 'holding', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "coils", "input", "holding", or "both".'
      });
    }
    
    if (isNaN(startAddress) || isNaN(endAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid register addresses. Both must be numbers.'
      });
    }
    
    if (startAddress < 0 || endAddress < 0) {
      return res.status(400).json({
        success: false,
        message: 'Register addresses must be non-negative.'
      });
    }
    
    if (startAddress > endAddress) {
      return res.status(400).json({
        success: false,
        message: 'Start address must be less than or equal to end address.'
      });
    }
    
    if (interval && (isNaN(interval) || interval < 100)) {
      return res.status(400).json({
        success: false,
        message: 'Interval must be a number >= 100ms.'
      });
    }
    
    // Check MQTT connection
    const mqttStatus = mqttClient.getStatus();
    if (!mqttStatus.connected) {
      // Try to connect to MQTT
      const connected = await mqttClient.connect();
      if (!connected) {
        return res.status(500).json({
          success: false,
          message: 'Failed to connect to MQTT broker. Please check MQTT configuration.'
        });
      }
    }
    
    const result = startMqttPollingLoop(startAddress, endAddress, interval, type, deviceId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting MQTT polling',
      error: error.message
    });
  }
}

async function stopMqttPolling(req, res) {
  try {
    const result = stopMqttPollingLoop();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error stopping MQTT polling',
      error: error.message
    });
  }
}

async function getMqttPollingStatus(req, res) {
  try {
    const status = getMqttStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting MQTT polling status',
      error: error.message
    });
  }
}

async function getMqttLogs(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const logs = getMqttLogsData(limit);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving MQTT logs',
      error: error.message
    });
  }
}

async function clearMqttLogs(req, res) {
  try {
    const result = clearMqttLogsData();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing MQTT logs',
      error: error.message
    });
  }
}

async function publishSingle(req, res) {
  try {
    const { topic, data, options = {} } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required'
      });
    }
    
    // Check MQTT connection
    const mqttStatus = mqttClient.getStatus();
    if (!mqttStatus.connected) {
      // Try to connect to MQTT
      const connected = await mqttClient.connect();
      if (!connected) {
        return res.status(500).json({
          success: false,
          message: 'Failed to connect to MQTT broker. Please check MQTT configuration.'
        });
      }
    }
    
    const result = await mqttClient.publish(topic, data, options);
    
    if (result.success) {
      addMqttLog('SUCCESS', `Manual publish to topic ${topic}`, result);
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing to MQTT',
      error: error.message
    });
  }
}

async function getMqttConnection(req, res) {
  try {
    const status = mqttClient.getStatus();
    res.json({
      success: true,
      connection: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting MQTT connection status',
      error: error.message
    });
  }
}

/**
 * Start individual register MQTT polling
 */
async function startIndividualMqttPolling(req, res) {
  try {
    const { registers } = req.body;
    const interval = req.body.interval ? parseInt(req.body.interval) : null;
    const deviceId = req.body.deviceId || 'device-1';
    
    if (!registers || !Array.isArray(registers) || registers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Registers array is required in request body. Example: {"registers": [300, 301, 302]}'
      });
    }
    
    // Validate register numbers
    for (const reg of registers) {
      if (!Number.isInteger(reg) || reg < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid register address: ${reg}. Must be non-negative integers.`
        });
      }
    }
    
    if (interval && (isNaN(interval) || interval < 100)) {
      return res.status(400).json({
        success: false,
        message: 'Interval must be a number >= 100ms.'
      });
    }
    
    // Check MQTT connection
    const mqttStatus = mqttClient.getStatus();
    if (!mqttStatus.connected) {
      // Try to connect to MQTT
      const connected = await mqttClient.connect();
      if (!connected) {
        return res.status(500).json({
          success: false,
          message: 'Failed to connect to MQTT broker. Please check MQTT configuration.'
        });
      }
    }
    
    const result = startIndividualRegisterPolling(registers, interval || 5000, deviceId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting individual register MQTT polling',
      error: error.message
    });
  }
}

/**
 * Read individual registers once (testing endpoint)
 */
async function readIndividualRegistersOnce(req, res) {
  try {
    const { registers } = req.body;
    
    if (!registers || !Array.isArray(registers) || registers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Registers array is required in request body. Example: {"registers": [300, 301, 302]}'
      });
    }
    
    // Validate register numbers
    for (const reg of registers) {
      if (!Number.isInteger(reg) || reg < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid register address: ${reg}. Must be non-negative integers.`
        });
      }
    }
    
    const results = await readIndividualInputRegisters(registers);
    
    res.json({
      success: true,
      message: 'Individual register read completed',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading individual registers',
      error: error.message
    });
  }
}

module.exports = {
  startMqttPolling,
  stopMqttPolling,
  getMqttPollingStatus,
  getMqttLogs,
  clearMqttLogs,
  publishSingle,
  getMqttConnection,
  getLatestMqttData,
  autoStartInputRegisterPolling,
  readIndividualInputRegisters,
  startIndividualRegisterPolling,
  startIndividualMqttPolling,
  readIndividualRegistersOnce
};