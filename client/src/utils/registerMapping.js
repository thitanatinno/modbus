/**
 * Centralized register mapping and scaling configuration
 * Single source of truth for all Modbus register operations
 */

// Register scaling constants
export const REGISTER_SCALES = {
  VOLTAGE_0_1V: 10,
  VOLTAGE_0_01V: 100,         // Divide by 100 for 0.01V resolution
  CURRENT_0_01A: 100,      // Divide by 100 for 0.01A resolution
  CURRENT_0_1A: 10,        // Divide by 10 for 0.1A resolution
  POWER_1W: 1,             // Direct value for 1W resolution
  TEMPERATURE_0_1C: 10,    // Divide by 10 for 0.1°C resolution
  PERCENTAGE: 1,           // Direct value for percentage
  SOC_PERCENTAGE: 1,       // Direct value for SOC percentage
};

// Complete register mapping with scaling information
export const REGISTER_MAP = {
  // Grid Voltage Registers (300-302)
  300: { name: "Grid Voltage A", scale: REGISTER_SCALES.VOLTAGE_0_01V, unit: "V", type: "Input Register" },
  301: { name: "Grid Voltage B", scale: REGISTER_SCALES.VOLTAGE_0_01V, unit: "V", type: "Input Register" },
  302: { name: "Grid Voltage C", scale: REGISTER_SCALES.VOLTAGE_0_01V, unit: "V", type: "Input Register" },
  
  // Grid Current Registers (311-313)
  311: { name: "Grid Current A", scale: REGISTER_SCALES.CURRENT_0_1A, unit: "A", type: "Input Register" },
  312: { name: "Grid Current B", scale: REGISTER_SCALES.CURRENT_0_1A, unit: "A", type: "Input Register" },
  313: { name: "Grid Current C", scale: REGISTER_SCALES.CURRENT_0_1A, unit: "A", type: "Input Register" },
  
  // Grid Power Registers (316-318)
  316: { name: "Grid Active Power", scale: REGISTER_SCALES.POWER_1W, unit: "W", type: "Input Register" },
  317: { name: "Grid Reactive Power", scale: REGISTER_SCALES.POWER_1W, unit: "var", type: "Input Register" },
  318: { name: "Grid Apparent Power", scale: REGISTER_SCALES.POWER_1W, unit: "VA", type: "Input Register" },
  
  // PV1 Registers (604-606)
  604: { name: "PV1 Voltage", scale: REGISTER_SCALES.VOLTAGE_0_1V, unit: "V", type: "Input Register" },
  605: { name: "PV1 Current", scale: REGISTER_SCALES.CURRENT_0_1A, unit: "A", type: "Input Register" },
  606: { name: "PV1 Power", scale: REGISTER_SCALES.POWER_1W, unit: "W", type: "Input Register" },
  
  // PV2 Registers (610-612)
  610: { name: "PV2 Voltage", scale: REGISTER_SCALES.VOLTAGE_0_1V, unit: "V", type: "Input Register" },
  611: { name: "PV2 Current", scale: REGISTER_SCALES.CURRENT_0_1A, unit: "A", type: "Input Register" },
  612: { name: "PV2 Power", scale: REGISTER_SCALES.POWER_1W, unit: "W", type: "Input Register" },
  
  // Battery Registers (1052-1065)
  1052: { name: "Battery Voltage", scale: REGISTER_SCALES.VOLTAGE_0_1V, unit: "V", type: "Input Register" },
  1053: { name: "Battery Current", scale: REGISTER_SCALES.CURRENT_0_1A, unit: "A", type: "Input Register" },
  1054: { name: "Battery Power", scale: REGISTER_SCALES.POWER_1W, unit: "W", type: "Input Register" },
  1057: { name: "Battery Cycles", scale: REGISTER_SCALES.PERCENTAGE, unit: "cycles", type: "Input Register" },
  1065: { name: "Battery SOC", scale: REGISTER_SCALES.SOC_PERCENTAGE, unit: "%", type: "Input Register" },
  
  // System Control Registers (Holding Registers)
  973: { name: "PV Curtailment Enable", scale: 1, unit: "–", type: "Holding Register" },
  974: { name: "PV Curtailment Value", scale: 1, unit: "W", type: "Holding Register" },
  1102: { name: "SOC SelfUse", scale: 1, unit: "%", type: "Holding Register" },
  1103: { name: "SOC Backup", scale: 1, unit: "%", type: "Holding Register" },
  1104: { name: "SOC ForceCharge", scale: 1, unit: "%", type: "Holding Register" },
  1105: { name: "SOC FeedIn", scale: 1, unit: "%", type: "Holding Register" },
  1106: { name: "SOC Off-Grid", scale: 1, unit: "%", type: "Holding Register" },
  3000: { name: "Modbus Scheduling Enable", scale: 1, unit: "–", type: "Holding Register" },
  3002: { name: "Power On/Off", scale: 1, unit: "–", type: "Holding Register" },
  3004: { name: "Control Mode", scale: 1, unit: "–", type: "Holding Register" },
  3005: { name: "Grid-Side Power Mode", scale: 1, unit: "–", type: "Holding Register" },
  3006: { name: "AC Total Active Power", scale: 1, unit: "W", type: "Holding Register" },
  3015: { name: "Battery Power Value", scale: 1, unit: "W", type: "Holding Register" },
  3112: { name: "Max Battery Charge Current", scale: 1, unit: "A", type: "Holding Register" },
  3113: { name: "Max Battery Discharge Current", scale: 1, unit: "A", type: "Holding Register" },
  3120: { name: "COM Port Baud Rate", scale: 1, unit: "–", type: "Holding Register" },
  3121: { name: "Modbus Address", scale: 1, unit: "–", type: "Holding Register" },
};

/**
 * Apply scaling to a raw register value
 * @param {number} address - Register address
 * @param {number} rawValue - Raw register value from Modbus
 * @returns {number} Scaled value (human-readable)
 */
export const scaleRegisterValue = (address, rawValue) => {
  const mapping = REGISTER_MAP[address];
  if (!mapping || rawValue === undefined || rawValue === null) {
    return rawValue;
  }
  return rawValue / mapping.scale;
};

/**
 * Apply reverse scaling (for writing to registers)
 * @param {number} address - Register address
 * @param {number} scaledValue - Human-readable value
 * @returns {number} Raw value to write to Modbus
 */
export const unscaleRegisterValue = (address, scaledValue) => {
  const mapping = REGISTER_MAP[address];
  if (!mapping || scaledValue === undefined || scaledValue === null) {
    return scaledValue;
  }
  return Math.round(scaledValue * mapping.scale);
};

/**
 * Get register information including name, scale, unit, type
 * @param {number} address - Register address
 * @returns {object|null} Register info or null if not found
 */
export const getRegisterInfo = (address) => {
  return REGISTER_MAP[address] || null;
};

/**
 * Check if a register exists in the mapping
 * @param {number} address - Register address
 * @returns {boolean} True if register is mapped
 */
export const hasRegisterMapping = (address) => {
  return address in REGISTER_MAP;
};

/**
 * Get all registers of a specific type
 * @param {string} type - "Input Register" or "Holding Register"
 * @returns {Array} Array of register addresses
 */
export const getRegistersByType = (type) => {
  return Object.entries(REGISTER_MAP)
    .filter(([_, info]) => info.type === type)
    .map(([address, _]) => parseInt(address));
};
