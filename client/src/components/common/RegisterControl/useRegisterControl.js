import { useState } from "react";

const useRegisterControl = () => {
  // Top 20 important registers configuration
  const readableRegisters = [
    { address: 300, hex: "0x012C", name: "Grid Voltage A", description: "Phase A RMS voltage", unit: "V", type: "Input Register" },
    { address: 301, hex: "0x012D", name: "Grid Voltage B", description: "Phase B RMS voltage", unit: "V", type: "Input Register" },
    { address: 302, hex: "0x012E", name: "Grid Voltage C", description: "Phase C RMS voltage", unit: "V", type: "Input Register" },
    { address: 311, hex: "0x0137", name: "Grid Current A", description: "Phase A RMS current", unit: "A", type: "Input Register" },
    { address: 312, hex: "0x0138", name: "Grid Current B", description: "Phase B RMS current", unit: "A", type: "Input Register" },
    { address: 313, hex: "0x0139", name: "Grid Current C", description: "Phase C RMS current", unit: "A", type: "Input Register" },
    { address: 316, hex: "0x013C", name: "Grid Active Power", description: "Real-time active power", unit: "W", type: "Input Register" },
    { address: 317, hex: "0x013D", name: "Grid Reactive Power", description: "Real-time reactive power", unit: "var", type: "Input Register" },
    { address: 318, hex: "0x013E", name: "Grid Apparent Power", description: "Real-time apparent power", unit: "VA", type: "Input Register" },
    { address: 604, hex: "0x025C", name: "PV1 Voltage", description: "PV panel 1 voltage", unit: "V", type: "Input Register" },
    { address: 605, hex: "0x025D", name: "PV1 Current", description: "PV panel 1 current", unit: "A", type: "Input Register" },
    { address: 606, hex: "0x025E", name: "PV1 Power", description: "PV panel 1 power", unit: "W", type: "Input Register" },
    { address: 610, hex: "0x0262", name: "PV2 Voltage", description: "PV panel 2 voltage", unit: "V", type: "Input Register" },
    { address: 611, hex: "0x0263", name: "PV2 Current", description: "PV panel 2 current", unit: "A", type: "Input Register" },
    { address: 612, hex: "0x0264", name: "PV2 Power", description: "PV panel 2 power", unit: "W", type: "Input Register" },
    { address: 1052, hex: "0x041C", name: "Battery Voltage", description: "Battery voltage", unit: "V", type: "Input Register" },
    { address: 1053, hex: "0x041D", name: "Battery Current", description: "Battery current", unit: "A", type: "Input Register" },
    { address: 1054, hex: "0x041E", name: "Battery Power", description: "Battery power", unit: "W", type: "Input Register" },
    { address: 1065, hex: "0x0429", name: "Battery SOC", description: "State of charge", unit: "%", type: "Input Register" },
  ];

  const writableRegisters = [
    { address: 3002, hex: "0x0BBA", name: "Power On/Off", description: "1=On, 2=Off, 3=Restart", unit: "–", range: "1-3", type: "Holding Register" },
    { address: 3004, hex: "0x0BBC", name: "Control Mode", description: "0=Battery, 1=AC mode", unit: "–", range: "0-1", type: "Holding Register" },
    { address: 3005, hex: "0x0BBD", name: "Grid-Side Power Mode", description: "0=Phase, 1=Total", unit: "–", range: "0-1", type: "Holding Register" },
    { address: 3006, hex: "0x0BBE", name: "AC Total Active Power", description: "Positive=Sell, Negative=Buy", unit: "W", range: "-999999 to 999999", type: "Holding Register" },
    { address: 3015, hex: "0x0BC7", name: "Battery Power Value", description: "Positive=Discharge, Negative=Charge", unit: "W", range: "-999999 to 999999", type: "Holding Register" },
    { address: 3112, hex: "0x0C28", name: "Max Battery Charge Current", description: "Limits charging current (0=No limit)", unit: "A", range: "0-200", type: "Holding Register" },
    { address: 3113, hex: "0x0C29", name: "Max Battery Discharge Current", description: "Limits discharge current", unit: "A", range: "0-200", type: "Holding Register" },
    { address: 3120, hex: "0x0C30", name: "COM Port Baud Rate", description: "1=9600, 2=19200, 3=38400, 4=115200", unit: "–", range: "1-4", type: "Holding Register" },
    { address: 3121, hex: "0x0C31", name: "Modbus Address", description: "Device address", unit: "–", range: "1-254", type: "Holding Register" },
    { address: 973, hex: "0x03CD", name: "PV Curtailment Enable", description: "0=Normal, 1=Curtail", unit: "–", range: "0-1", type: "Holding Register" },
    { address: 974, hex: "0x03CE", name: "PV Curtailment Value", description: "PV output limit", unit: "W", range: "0-999999", type: "Holding Register" },
    { address: 1102, hex: "0x044E", name: "SOC SelfUse", description: "SOC for Self-Use mode", unit: "%", range: "0-100", type: "Holding Register" },
    { address: 1103, hex: "0x044F", name: "SOC Backup", description: "SOC for Backup mode", unit: "%", range: "0-100", type: "Holding Register" },
    { address: 1104, hex: "0x0450", name: "SOC ForceCharge", description: "SOC for Force Charge mode", unit: "%", range: "0-100", type: "Holding Register" },
    { address: 1105, hex: "0x0451", name: "SOC FeedIn", description: "SOC for Feed-In mode", unit: "%", range: "0-100", type: "Holding Register" },
    { address: 1106, hex: "0x0452", name: "SOC Off-Grid", description: "SOC for Off-Grid mode", unit: "%", range: "0-100", type: "Holding Register" },
    { address: 3000, hex: "0x0BB8", name: "Modbus Scheduling Enable", description: "0=Off, 1=On", unit: "–", range: "0-1", type: "Holding Register" },
  ];

  const [stateRegisterControl, setState] = useState({
    readableRegisters,
    writableRegisters,
    activeTab: "read",
    selectedReadRegisters: [],
    selectedWriteRegister: "",
    writeValue: "",
    selectedRegisterInfo: null,
    readResults: [],
    writeResult: null,
    reading: false,
    writing: false,
    error: null,
  });

  const setRegisterControl = (field, value) => {
    if (typeof field === "object") {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  const toggleRegisterControlField = (field) => {
    setState((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  return {
    stateRegisterControl,
    setRegisterControl,
    toggleRegisterControlField,
  };
};

export default useRegisterControl;
