const readCoils = require('../utils/readCoils');
const readHoldingRegisters = require('../utils/readHoldingRegisters');
const config = require('../../config');

// State management for polling
let pollingInterval = null;
let isPolling = false;
let latestData = {
  coils: null,
  holdingRegisters: null
};
let logs = [];
const MAX_LOGS = 100; // Keep last 100 log entries

/**
 * Add log entry
 */
function addLog(type, message, data = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    data
  };
  
  logs.push(logEntry);
  
  // Keep only last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  
  console.log(`[${logEntry.timestamp}] [${type}] ${message}`);
}

/**
 * Start polling loop
 * @param {number} startAddress - Starting register address
 * @param {number} endAddress - Ending register address
 * @param {number} interval - Polling interval in milliseconds (optional)
 * @param {string} type - Type of read: 'coils', 'holding', or 'both' (optional, default: 'both')
 */
function startPolling(startAddress, endAddress, interval = null, type = 'both') {
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
  
  // Function to perform the polling
  const poll = async () => {
    try {
      const results = {};
      
      // Read coils if requested
      if (type === 'coils' || type === 'both') {
        const coilResult = await readCoils(startAddress, count);
        results.coils = coilResult;
        latestData.coils = coilResult;
        
        if (coilResult.success) {
          addLog('SUCCESS', `Polled coils ${startAddress}-${endAddress}`, coilResult.data);
        } else {
          addLog('ERROR', `Failed to poll coils ${startAddress}-${endAddress}`, coilResult.error);
        }
      }
      
      // Read holding registers if requested
      if (type === 'holding' || type === 'both') {
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
  
  // Perform first poll immediately
  poll();
  
  // Set up interval for continuous polling
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

/**
 * Stop polling loop
 */
function stopPolling() {
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

/**
 * Get polling status
 */
function getPollingStatus() {
  return {
    isPolling,
    latestData,
    totalLogs: logs.length
  };
}

/**
 * Get latest data
 */
function getLatestData() {
  return latestData;
}

/**
 * Get logs
 * @param {number} limit - Number of recent logs to return (optional)
 */
function getLogs(limit = null) {
  if (limit && limit > 0) {
    return logs.slice(-limit);
  }
  return logs;
}

/**
 * Clear logs
 */
function clearLogs() {
  logs = [];
  addLog('INFO', 'Logs cleared');
  return {
    success: true,
    message: 'Logs cleared successfully'
  };
}

module.exports = {
  startPolling,
  stopPolling,
  getPollingStatus,
  getLatestData,
  getLogs,
  clearLogs
};
