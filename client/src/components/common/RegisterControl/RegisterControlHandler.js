import { 
  readInputRegisters, 
  readHoldingRegisters,
  writeSingleRegister 
} from "../../../api/powerMeterService";
import { scaleRegisterValue, unscaleRegisterValue } from "../../../utils/registerMapping";

const RegisterControlHandler = (state, setState) => {
  // Toggle read register selection (card click)
  const handleToggleReadRegister = (address) => {
    const isSelected = state.selectedReadRegisters.includes(address);
    const newSelection = isSelected
      ? state.selectedReadRegisters.filter((addr) => addr !== address)
      : [...state.selectedReadRegisters, address];
    
    setState("selectedReadRegisters", newSelection);
  };

  // Clear all read selections
  const handleClearReadSelection = () => {
    setState("selectedReadRegisters", []);
  };

  // Select write register (card click)
  const handleSelectWriteRegister = (address) => {
    setState("selectedWriteRegister", address);
    
    // Find and set register info
    const registerInfo = state.writableRegisters.find(
      (reg) => reg.address.toString() === address
    );
    setState("selectedRegisterInfo", registerInfo || null);
  };

  // Clear write selection
  const handleClearWriteSelection = () => {
    setState({
      selectedWriteRegister: "",
      selectedRegisterInfo: null,
      writeValue: "",
      writeResult: null,
    });
  };

  // Handle write value change
  const handleWriteValueChange = (e) => {
    setState("writeValue", e.target.value);
  };

  // Read selected registers
  const handleReadRegisters = async () => {
    try {
      setState({
        reading: true,
        error: null,
        readResults: [],
      });

      const results = [];

      // Read each selected register
      for (const address of state.selectedReadRegisters) {
        const registerInfo = state.readableRegisters.find(
          reg => reg.address.toString() === address
        );

        if (!registerInfo) continue;

        try {
          // Read input register (single address)
          const response = await readInputRegisters(registerInfo.address, registerInfo.address);

          if (response.data && response.data.success) {
            const dataObj = response.data.data;
            const rawValue = dataObj?.data?.[0];

            // Use centralized scaling from registerMapping
            const scaledValue = scaleRegisterValue(registerInfo.address, rawValue);
            const displayValue = typeof scaledValue === 'number' ? scaledValue.toFixed(2) : scaledValue;

            results.push({
              ...registerInfo,
              value: displayValue,
              rawValue: rawValue,
            });
          }
        } catch (error) {
          console.error(`Error reading register ${registerInfo.address}:`, error);
          results.push({
            ...registerInfo,
            value: "Error",
            rawValue: 0,
            error: error.message,
          });
        }
      }

      setState({
        readResults: results,
        reading: false,
      });

    } catch (error) {
      console.error("Error reading registers:", error);
      setState({
        error: error.message || "Failed to read registers",
        reading: false,
      });
    }
  };

  // Write to selected register
  const handleWriteRegister = async () => {
    try {
      setState({
        writing: true,
        error: null,
        writeResult: null,
      });

      const address = parseInt(state.selectedWriteRegister);
      const userValue = parseInt(state.writeValue);

      if (isNaN(address) || isNaN(userValue)) {
        throw new Error("Invalid address or value");
      }

      // Apply reverse scaling if needed (most holding registers don't need it, but keep for consistency)
      const rawValue = unscaleRegisterValue(address, userValue);

      // Write single register
      const response = await writeSingleRegister(address, rawValue);

      if (response.data && response.data.success) {
        setState({
          writeResult: {
            success: true,
            message: `Successfully wrote value ${userValue} to register ${address} (${state.selectedRegisterInfo?.name})`,
          },
          writing: false,
          writeValue: "", // Clear value after successful write
        });
      } else {
        throw new Error(response.data?.message || "Write operation failed");
      }

    } catch (error) {
      console.error("Error writing register:", error);
      setState({
        writeResult: {
          success: false,
          message: error.message || "Failed to write register",
        },
        writing: false,
      });
    }
  };

  return {
    handleToggleReadRegister,
    handleClearReadSelection,
    handleSelectWriteRegister,
    handleClearWriteSelection,
    handleWriteValueChange,
    handleReadRegisters,
    handleWriteRegister,
  };
};

export default RegisterControlHandler;
