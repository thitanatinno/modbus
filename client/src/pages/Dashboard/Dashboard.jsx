import React from "react";
import styles from "./Dashboard.module.scss";
import useDashboard from "./useDashboard";
import DashboardHandler from "./DashboardHandler";
import { MeterCard, LoadingSpinner } from "../../components/common";

export default function Dashboard() {
  const { stateDashboard, setDashboard } = useDashboard();
  const handlers = DashboardHandler(stateDashboard, setDashboard);

  if (stateDashboard.loading) {
    return (
      <div className={styles.LoadingContainer}>
        <LoadingSpinner size="large" message="Connecting to Power Meter..." />
      </div>
    );
  }

  if (stateDashboard.error) {
    return (
      <div className={styles.ErrorContainer}>
        <h2 className={styles.ErrorTitle}>Connection Error</h2>
        <p className={styles.ErrorMessage}>{stateDashboard.error}</p>
        <button className={styles.RetryButton} onClick={handlers.handleRetry}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      <header className={styles.Header}>
        <h1 className={styles.Title}>Power Meter Dashboard</h1>
        <div className={styles.StatusBar}>
          <div className={`${styles.StatusIndicator} ${stateDashboard.isPolling ? styles.Active : styles.Inactive}`}>
            {stateDashboard.isPolling ? "● Connected" : "○ Disconnected"}
          </div>
          <span className={styles.LastUpdate}>
            Last Update: {stateDashboard.lastUpdate}
          </span>
        </div>
      </header>

      <div className={styles.ControlPanel}>
        <button 
          className={`${styles.ControlButton} ${stateDashboard.isPolling ? styles.Stop : styles.Start}`}
          onClick={stateDashboard.isPolling ? handlers.handleStopPolling : handlers.handleStartPolling}
          disabled={stateDashboard.loading}
        >
          {stateDashboard.isPolling ? "Stop Monitoring" : "Start Monitoring"}
        </button>
        
        <button 
          className={styles.RefreshButton}
          onClick={handlers.handleRefresh}
          disabled={stateDashboard.loading}
        >
          Refresh Data
        </button>
      </div>

      <div className={styles.GridContainer}>
        {/* PV1 Section */}
        <div className={styles.Section}>
          <h2 className={styles.SectionTitle}>PV1 (Photovoltaic 1)</h2>
          <div className={styles.MeterGrid}>
            <MeterCard
              title="Voltage"
              value={stateDashboard.pv1.voltage}
              unit="V"
              status={stateDashboard.pv1.voltage > 0 ? "active" : "inactive"}
              icon="⚡"
            />
            <MeterCard
              title="Current"
              value={stateDashboard.pv1.current}
              unit="A"
              status={stateDashboard.pv1.current > 0 ? "active" : "inactive"}
              icon="🔌"
            />
            <MeterCard
              title="Power"
              value={stateDashboard.pv1.power}
              unit="W"
              status={stateDashboard.pv1.power > 0 ? "active" : "inactive"}
              icon="💡"
            />
          </div>
        </div>

        {/* PV2 Section */}
        <div className={styles.Section}>
          <h2 className={styles.SectionTitle}>PV2 (Photovoltaic 2)</h2>
          <div className={styles.MeterGrid}>
            <MeterCard
              title="Voltage"
              value={stateDashboard.pv2.voltage}
              unit="V"
              status={stateDashboard.pv2.voltage > 0 ? "active" : "inactive"}
              icon="⚡"
            />
            <MeterCard
              title="Current"
              value={stateDashboard.pv2.current}
              unit="A"
              status={stateDashboard.pv2.current > 0 ? "active" : "inactive"}
              icon="🔌"
            />
            <MeterCard
              title="Power"
              value={stateDashboard.pv2.power}
              unit="W"
              status={stateDashboard.pv2.power > 0 ? "active" : "inactive"}
              icon="💡"
            />
          </div>
        </div>

        {/* Total Power Section */}
        <div className={styles.Section}>
          <h2 className={styles.SectionTitle}>Total System</h2>
          <div className={styles.MeterGrid}>
            <MeterCard
              title="Total Power"
              value={stateDashboard.totalPower}
              unit="W"
              status={stateDashboard.totalPower > 0 ? "active" : "inactive"}
              icon="⚙️"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
