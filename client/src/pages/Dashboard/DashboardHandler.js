import { readInputRegisters } from "../../api/powerMeterService";
import { scaleRegisterValue } from "../../utils/registerMapping";
import config from "../../config";

/**
 * Dashboard Handler - Client-side polling implementation
 * Uses direct read API calls with client-controlled intervals
 */

const DashboardHandler = (stateDashboard, setDashboard) => {
  // Store interval ID for cleanup
  let pollingIntervalId = null;

  // Parse register data and update state
  const parseRegisterData = (responseData) => {
    // Extract the data array from the nested response object
    // Response format: { success, type, attempts, data: { success, timestamp, startAddress, count, data: [...] } }
    const dataObj = responseData?.data;
    const registers = dataObj?.data;
    
    if (!registers || !Array.isArray(registers)) {
      console.error("Invalid data format - expected nested data array:", responseData);
      return;
    }
    
    // Register mapping (604-615 range):
    // Index 0 (604): PV1 Voltage
    // Index 1 (605): PV1 Current
    // Index 2 (606): PV1 Power
    // Index 6 (610): PV2 Voltage
    // Index 7 (611): PV2 Current
    // Index 8 (612): PV2 Power
    
    // Use centralized scaling from registerMapping
    const pv1Voltage = scaleRegisterValue(604, registers[0] || 0);
    const pv1Current = scaleRegisterValue(605, registers[1] || 0);
    const pv1Power = scaleRegisterValue(606, registers[2] || 0);
    
    const pv2Voltage = scaleRegisterValue(610, registers[6] || 0);
    const pv2Current = scaleRegisterValue(611, registers[7] || 0);
    const pv2Power = scaleRegisterValue(612, registers[8] || 0);
    
    const totalPower = pv1Power + pv2Power;

    setDashboard({
      pv1: {
        voltage: pv1Voltage.toFixed(2),
        current: pv1Current.toFixed(2),
        power: pv1Power.toFixed(2),
      },
      pv2: {
        voltage: pv2Voltage.toFixed(2),
        current: pv2Current.toFixed(2),
        power: pv2Power.toFixed(2),
      },
      totalPower: totalPower.toFixed(2),
      lastUpdate: new Date().toLocaleTimeString(),
      loading: false,
      error: null,
    });
  };

  // Fetch data from API using read endpoint
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setDashboard("loading", true);
      }
      
      // Read input registers 604-615 (includes PV1 and PV2 data)
      const response = await readInputRegisters(604, 615);
      
      if (response.data && response.data.success) {
        // Pass the entire response.data object which has nested data structure
        // response.data = { success, type, attempts, data: { success, timestamp, data: [...] } }
        parseRegisterData(response.data);
      } else {
        throw new Error(response.data?.message || "Failed to read registers");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Don't show error if we're polling (just log it)
      if (!stateDashboard.isPolling || showLoading) {
        setDashboard({
          error: error.response?.data?.message || error.message || "Failed to connect to power meter",
          loading: false,
        });
      } else {
        // If polling, just update loading state
        setDashboard("loading", false);
      }
    }
  };

  // Start client-side polling
  const handleStartPolling = async () => {
    try {
      // Mark as polling
      setDashboard({
        isPolling: true,
        loading: true,
        error: null,
      });
      
      // Initial data fetch
      await fetchData(true);
      
      // Set up client-side polling interval
      pollingIntervalId = setInterval(async () => {
        await fetchData(false); // Don't show loading on subsequent polls
      }, config.pollingInterval);
      
      // Store interval ID globally for cleanup
      window.dashboardPollingInterval = pollingIntervalId;
      
      console.log(`Client-side polling started (interval: ${config.pollingInterval}ms)`);
      
    } catch (error) {
      console.error("Error starting polling:", error);
      setDashboard({
        error: "Failed to start monitoring",
        loading: false,
        isPolling: false,
      });
    }
  };

  // Stop client-side polling
  const handleStopPolling = () => {
    try {
      // Clear the interval
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
      }
      
      // Clear global interval if exists
      if (window.dashboardPollingInterval) {
        clearInterval(window.dashboardPollingInterval);
        window.dashboardPollingInterval = null;
      }
      
      setDashboard({
        isPolling: false,
      });
      
      console.log("Client-side polling stopped");
    } catch (error) {
      console.error("Error stopping polling:", error);
    }
  };

  // Refresh data manually (single read)
  const handleRefresh = async () => {
    if (!stateDashboard.isPolling) {
      await fetchData(true);
    }
  };

  // Retry connection after error
  const handleRetry = async () => {
    setDashboard({
      error: null,
      loading: true,
    });
    
    await fetchData(true);
  };

  // Initialize - fetch data once on mount
  const initialize = async () => {
    try {
      setDashboard({
        loading: true,
        error: null,
      });
      
      await fetchData(true);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      setDashboard({
        loading: false,
      });
    }
  };

  // Cleanup function to stop polling
  const cleanup = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
    
    if (window.dashboardPollingInterval) {
      clearInterval(window.dashboardPollingInterval);
      window.dashboardPollingInterval = null;
    }
  };

  return {
    handleStartPolling,
    handleStopPolling,
    handleRefresh,
    handleRetry,
    fetchData,
    initialize,
    cleanup,
  };
};

export default DashboardHandler;
