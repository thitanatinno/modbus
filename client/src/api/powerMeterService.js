import axiosInstance from "./axiosInstance";

/**
 * Power Meter Service - API calls for Modbus power meter data
 * Uses client-side polling with direct read endpoints
 */

// Read holding registers from specific address range
export const readHoldingRegisters = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/holding/${startAddress}/${endAddress}`);

// Read input registers from specific address range
export const readInputRegisters = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/input/${startAddress}/${endAddress}`);

// Read coils from specific address range
export const readCoils = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/coils/${startAddress}/${endAddress}`);

// Read discrete inputs from specific address range
export const readDiscreteInputs = (startAddress, endAddress) => 
  axiosInstance.get(`/api/read/discrete/${startAddress}/${endAddress}`);

// Write single coil
export const writeSingleCoil = (address, value) => 
  axiosInstance.post(`/api/write/coil/${address}`, { value });

// Write single register
export const writeSingleRegister = (address, value) => 
  axiosInstance.post(`/api/write/register/${address}`, { value });

// Health check
export const healthCheck = () => 
  axiosInstance.get("/health");
