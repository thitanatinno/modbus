import axiosInstance from "./axiosInstance";

/**
 * Power Meter Service - API calls for Modbus power meter data
 */

// Get latest data from polling
export const getLatestData = () => 
  axiosInstance.get("/api/polling/status");

// Read holding registers from specific address range
export const readHoldingRegisters = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/holding/${startAddress}/${endAddress}`);

// Read input registers from specific address range
export const readInputRegisters = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/input/${startAddress}/${endAddress}`);

// Start polling for specific register range
export const startPolling = (type, startAddress, endAddress, interval = 5000) => 
  axiosInstance.post(`/api/polling/start/${type}/${startAddress}/${endAddress}`, { 
    interval 
  });

// Stop polling
export const stopPolling = () => 
  axiosInstance.post("/api/polling/stop");

// Get polling status
export const getPollingStatus = () => 
  axiosInstance.get("/api/polling/status");

// Get logs
export const getLogs = (limit = 50) => 
  axiosInstance.get("/api/polling/logs", { 
    params: { limit } 
  });

// Health check
export const healthCheck = () => 
  axiosInstance.get("/health");
