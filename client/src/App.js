import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import DashboardHandler from "./pages/Dashboard/DashboardHandler";
import useDashboard from "./pages/Dashboard/useDashboard";
import "./styles/main.scss";

function App() {
  const { stateDashboard, setDashboard } = useDashboard();
  const handlers = DashboardHandler(stateDashboard, setDashboard);

  // Check status on mount
  useEffect(() => {
    handlers.checkStatus();
    
    // Cleanup on unmount
    return () => {
      if (window.dashboardPollingInterval) {
        clearInterval(window.dashboardPollingInterval);
      }
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
