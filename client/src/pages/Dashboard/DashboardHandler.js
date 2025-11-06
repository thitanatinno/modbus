import { 
  readInputRegisters, 
  startPolling, 
  stopPolling, 
  getPollingStatus 
} from "../../api/powerMeterService";

const DashboardHandler = (stateDashboard, setDashboard) => {
  // Parse register data and update state
  const parseRegisterData = (data) => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error("Invalid data format:", data);
      return;
    }

    const registers = data.data;
    
    // Register mapping:
    // 604: PV1 Voltage
    // 605: PV1 Current
    // 606: PV1 Power
    // 610: PV2 Voltage
    // 611: PV2 Current
    // 612: PV2 Power
    
    const pv1Voltage = (registers[0] || 0) / 10; // Assuming 0.1 scale
    const pv1Current = (registers[1] || 0) / 10;
    const pv1Power = registers[2] || 0;
    
    const pv2Voltage = (registers[6] || 0) / 10;
    const pv2Current = (registers[7] || 0) / 10;
    const pv2Power = registers[8] || 0;
    
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

  // Fetch data from API
  const fetchData = async () => {
    try {
      setDashboard("loading", true);
      
      // Read registers 604-612 (includes PV1 and PV2 data)
      const response = await readInputRegisters(604, 612);
      
      if (response.data && response.data.success) {
        parseRegisterData(response.data.data);
      } else {
        throw new Error("Failed to read registers");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setDashboard({
        error: error.message || "Failed to connect to power meter",
        loading: false,
      });
    }
  };

  // Start polling
  const handleStartPolling = async () => {
    try {
      setDashboard("loading", true);
      
      // Start polling input registers 604-612 every 5 seconds
      await startPolling("input", 604, 612, 5000);
      
      setDashboard({
        isPolling: true,
        loading: false,
      });
      
      // Initial fetch
      await fetchData();
      
      // Set up interval to fetch latest data
      const intervalId = setInterval(async () => {
        await fetchData();
      }, 5000);
      
      // Store interval ID for cleanup
      window.dashboardPollingInterval = intervalId;
      
    } catch (error) {
      console.error("Error starting polling:", error);
      setDashboard({
        error: "Failed to start monitoring",
        loading: false,
      });
    }
  };

  // Stop polling
  const handleStopPolling = async () => {
    try {
      await stopPolling();
      
      // Clear interval
      if (window.dashboardPollingInterval) {
        clearInterval(window.dashboardPollingInterval);
        window.dashboardPollingInterval = null;
      }
      
      setDashboard({
        isPolling: false,
      });
    } catch (error) {
      console.error("Error stopping polling:", error);
    }
  };

  // Refresh data manually
  const handleRefresh = async () => {
    await fetchData();
  };

  // Retry connection
  const handleRetry = async () => {
    setDashboard({
      error: null,
      loading: true,
    });
    
    await fetchData();
  };

  // Check polling status on mount
  const checkStatus = async () => {
    try {
      const response = await getPollingStatus();
      
      if (response.data && response.data.success) {
        const status = response.data.status;
        
        if (status.isPolling) {
          setDashboard({
            isPolling: true,
          });
          
          // Start fetching data
          await fetchData();
          
          // Set up interval
          const intervalId = setInterval(async () => {
            await fetchData();
          }, 5000);
          
          window.dashboardPollingInterval = intervalId;
        } else {
          setDashboard({
            loading: false,
          });
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setDashboard({
        loading: false,
      });
    }
  };

  return {
    handleStartPolling,
    handleStopPolling,
    handleRefresh,
    handleRetry,
    fetchData,
    checkStatus,
  };
};

export default DashboardHandler;
