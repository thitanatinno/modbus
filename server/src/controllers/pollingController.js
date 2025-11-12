const readCoils = require('../utils/readCoils');
const readInputRegisters = require('../utils/readInputRegisters');
const readHoldingRegisters = require('../utils/readHoldingRegisters');
const config = require('../../config');
const { getThaiTimestamp } = require('../utils/dateUtils');

// State management for polling
let pollingInterval = null;
let isPolling = false;
let latestData = {
  coils: null,
  inputRegisters: null,
  holdingRegisters: null
};
let logs = [];
const MAX_LOGS = 100;

function addLog(type, message, data = null) {
  const logEntry = {
    timestamp: getThaiTimestamp(),
    type,
    message,
    data
  };
  
  logs.push(logEntry);
  
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  
  console.log(`[${logEntry.timestamp}] [${type}] ${message}`);
}

function startPollingLoop(startAddress, endAddress, interval = null, type = 'both') {
  if (isPolling) {
    addLog('WARNING', 'Polling is already running');
    return {
      success: false,
      message: 'Polling is already running',
      currentConfig: {
        startAddress,
        endAddress,
        count: endAddress - startAddress + 1,
        type
      }
    };
  }
  
  const count = endAddress - startAddress + 1;
  const pollInterval = interval || config.reading.interval || 5000;
  
  addLog('INFO', `Starting polling loop: Register ${startAddress}-${endAddress} (count: ${count}), type: ${type}, interval: ${pollInterval}ms`);
  
  const poll = async () => {
    try {
      const results = {};
      
      if (type === 'coils') {
        const coilResult = await readCoils(startAddress, count);
        results.coils = coilResult;
        latestData.coils = coilResult;
        
        if (coilResult.success) {
          addLog('SUCCESS', `Polled coils ${startAddress}-${endAddress}`, coilResult.data);
        } else {
          addLog('ERROR', `Failed to poll coils ${startAddress}-${endAddress}`, coilResult.error);
        }
      }
      
      if (type === 'input') {
        const inputResult = await readInputRegisters(startAddress, count);
        results.inputRegisters = inputResult;
        latestData.inputRegisters = inputResult;
        
        if (inputResult.success) {
          addLog('SUCCESS', `Polled input registers ${startAddress}-${endAddress}`, inputResult.data);
        } else {
          addLog('ERROR', `Failed to poll input registers ${startAddress}-${endAddress}`, inputResult.error);
        }
      }
      
      if (type === 'holding') {
        const holdingResult = await readHoldingRegisters(startAddress, count);
        results.holdingRegisters = holdingResult;
        latestData.holdingRegisters = holdingResult;
        
        if (holdingResult.success) {
          addLog('SUCCESS', `Polled holding registers ${startAddress}-${endAddress}`, holdingResult.data);
        } else {
          addLog('ERROR', `Failed to poll holding registers ${startAddress}-${endAddress}`, holdingResult.error);
        }
      }
      
    } catch (error) {
      addLog('ERROR', `Polling error: ${error.message}`);
    }
  };
  
  poll();
  
  pollingInterval = setInterval(poll, pollInterval);
  isPolling = true;
  
  return {
    success: true,
    message: 'Polling started successfully',
    config: {
      startAddress,
      endAddress,
      count,
      type,
      interval: pollInterval
    }
  };
}

function stopPollingLoop() {
  if (!isPolling) {
    addLog('WARNING', 'Polling is not running');
    return {
      success: false,
      message: 'Polling is not running'
    };
  }
  
  clearInterval(pollingInterval);
  pollingInterval = null;
  isPolling = false;
  
  addLog('INFO', 'Polling stopped');
  
  return {
    success: true,
    message: 'Polling stopped successfully'
  };
}

function getStatus() {
  return {
    isPolling,
    latestData,
    totalLogs: logs.length
  };
}

function getLatestData() {
  return latestData;
}

function getLogsData(limit = null) {
  if (limit && limit > 0) {
    return logs.slice(-limit);
  }
  return logs;
}

function clearLogsData() {
  logs = [];
  addLog('INFO', 'Logs cleared');
  return {
    success: true,
    message: 'Logs cleared successfully'
  };
}

async function startPolling(req, res) {
  try {
    const type = req.params.type;
    const startAddress = parseInt(req.params.startAddress);
    const endAddress = parseInt(req.params.endAddress);
    const interval = req.body.interval ? parseInt(req.body.interval) : null;
    
    // Validate type
    if (!['coils', 'input', 'holding'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "coils", "input", or "holding".'
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
    
    const result = startPollingLoop(startAddress, endAddress, interval, type);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting polling',
      error: error.message
    });
  }
}

async function stopPolling(req, res) {
  try {
    const result = stopPollingLoop();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error stopping polling',
      error: error.message
    });
  }
}

async function getPollingStatus(req, res) {
  try {
    const status = getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting polling status',
      error: error.message
    });
  }
}

async function getLogs(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const logs = getLogsData(limit);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving logs',
      error: error.message
    });
  }
}

async function clearLogs(req, res) {
  try {
    const result = clearLogsData();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing logs',
      error: error.message
    });
  }
}

module.exports = {
  startPolling,
  stopPolling,
  getPollingStatus,
  getLogs,
  clearLogs,
  getLatestData
};
