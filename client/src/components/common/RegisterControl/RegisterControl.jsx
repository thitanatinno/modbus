import React from "react";
import styles from "./RegisterControl.module.scss";
import useRegisterControl from "./useRegisterControl";
import RegisterControlHandler from "./RegisterControlHandler";

export default function RegisterControl() {
  const { stateRegisterControl, setRegisterControl } = useRegisterControl();
  const handlers = RegisterControlHandler(stateRegisterControl, setRegisterControl);

  return (
    <div className={styles.Container}>
      {/* Header with Tabs */}
      <div className={styles.Header}>
        <div className={styles.HeaderContent}>
          <div className={styles.TitleGroup}>
            <h2 className={styles.Title}>⚙️ Advanced Register Control</h2>
            <p className={styles.Subtitle}>Direct Modbus register access for monitoring and configuration</p>
          </div>
        </div>
        
        <div className={styles.Tabs}>
          <button 
            className={`${styles.Tab} ${stateRegisterControl.activeTab === "read" ? styles.Active : ""}`}
            onClick={() => setRegisterControl("activeTab", "read")}
          >
            <span className={styles.TabIcon}>📖</span>
            Read Registers
          </button>
          <button 
            className={`${styles.Tab} ${stateRegisterControl.activeTab === "write" ? styles.Active : ""}`}
            onClick={() => setRegisterControl("activeTab", "write")}
          >
            <span className={styles.TabIcon}>✏️</span>
            Write Registers
          </button>
        </div>
      </div>

      <div className={styles.Content}>
        {/* Read Section */}
        {stateRegisterControl.activeTab === "read" && (
          <div className={styles.TabContent}>
            <div className={styles.SectionHeader}>
              <h3 className={styles.SectionTitle}>Select Registers to Monitor</h3>
              <span className={styles.Badge}>{stateRegisterControl.selectedReadRegisters.length} selected</span>
            </div>

            <div className={styles.RegisterGrid}>
              {stateRegisterControl.readableRegisters.map((reg) => (
                <div 
                  key={reg.address}
                  className={`${styles.RegisterCard} ${
                    stateRegisterControl.selectedReadRegisters.includes(reg.address.toString()) 
                      ? styles.Selected 
                      : ""
                  }`}
                  onClick={() => handlers.handleToggleReadRegister(reg.address.toString())}
                >
                  <div className={styles.CardHeader}>
                    <span className={styles.RegisterName}>{reg.name}</span>
                    <span className={styles.RegisterBadge}>{reg.type === "Input Register" ? "IN" : "HOLD"}</span>
                  </div>
                  <div className={styles.CardAddress}>
                    <span className={styles.AddressDec}>{reg.address}</span>
                    <span className={styles.AddressSep}>•</span>
                    <span className={styles.AddressHex}>{reg.hex}</span>
                  </div>
                  <div className={styles.CardDescription}>{reg.description}</div>
                  <div className={styles.CardUnit}>{reg.unit}</div>
                </div>
              ))}
            </div>

            <div className={styles.ActionBar}>
              <button
                className={styles.PrimaryButton}
                onClick={handlers.handleReadRegisters}
                disabled={stateRegisterControl.reading || stateRegisterControl.selectedReadRegisters.length === 0}
              >
                {stateRegisterControl.reading ? (
                  <>
                    <span className={styles.Spinner}></span>
                    Reading...
                  </>
                ) : (
                  <>
                    <span className={styles.ButtonIcon}>📊</span>
                    Read {stateRegisterControl.selectedReadRegisters.length} Register{stateRegisterControl.selectedReadRegisters.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
              
              {stateRegisterControl.selectedReadRegisters.length > 0 && (
                <button
                  className={styles.SecondaryButton}
                  onClick={handlers.handleClearReadSelection}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {stateRegisterControl.readResults.length > 0 && (
              <div className={styles.Results}>
                <div className={styles.ResultsHeader}>
                  <h4 className={styles.ResultsTitle}>📈 Results</h4>
                  <span className={styles.ResultsTime}>
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.ResultsGrid}>
                  {stateRegisterControl.readResults.map((result, index) => (
                    <div key={index} className={styles.ResultCard}>
                      <div className={styles.ResultCardHeader}>
                        <span className={styles.ResultName}>{result.name}</span>
                        <span className={styles.ResultAddress}>{result.address}</span>
                      </div>
                      <div className={styles.ResultValue}>
                        {result.value} <span className={styles.ResultUnit}>{result.unit}</span>
                      </div>
                      <div className={styles.ResultMeta}>
                        <span className={styles.ResultHex}>{result.hex}</span>
                        <span className={styles.ResultRaw}>Raw: {result.rawValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Write Section */}
        {stateRegisterControl.activeTab === "write" && (
          <div className={styles.TabContent}>
            <div className={styles.SectionHeader}>
              <h3 className={styles.SectionTitle}>Select Register to Configure</h3>
              <span className={styles.WarningBadge}>⚠️ Caution: Write operations affect device behavior</span>
            </div>

            <div className={styles.RegisterGrid}>
              {stateRegisterControl.writableRegisters.map((reg) => (
                <div 
                  key={reg.address}
                  className={`${styles.RegisterCard} ${
                    stateRegisterControl.selectedWriteRegister === reg.address.toString()
                      ? styles.Selected 
                      : ""
                  }`}
                  onClick={() => handlers.handleSelectWriteRegister(reg.address.toString())}
                >
                  <div className={styles.CardHeader}>
                    <span className={styles.RegisterName}>{reg.name}</span>
                    <span className={styles.RegisterBadge}>HOLD</span>
                  </div>
                  <div className={styles.CardAddress}>
                    <span className={styles.AddressDec}>{reg.address}</span>
                    <span className={styles.AddressSep}>•</span>
                    <span className={styles.AddressHex}>{reg.hex}</span>
                  </div>
                  <div className={styles.CardDescription}>{reg.description}</div>
                  <div className={styles.CardRange}>Range: {reg.range}</div>
                </div>
              ))}
            </div>

            {stateRegisterControl.selectedWriteRegister && stateRegisterControl.selectedRegisterInfo && (
              <div className={styles.WritePanel}>
                <div className={styles.WritePanelHeader}>
                  <div className={styles.WritePanelTitle}>
                    <span className={styles.WritePanelIcon}>✏️</span>
                    {stateRegisterControl.selectedRegisterInfo.name}
                  </div>
                  <button 
                    className={styles.CloseButton}
                    onClick={() => handlers.handleClearWriteSelection()}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.WritePanelContent}>
                  <div className={styles.InfoGrid}>
                    <div className={styles.InfoCard}>
                      <span className={styles.InfoCardLabel}>Address</span>
                      <span className={styles.InfoCardValue}>
                        {stateRegisterControl.selectedRegisterInfo.address} / {stateRegisterControl.selectedRegisterInfo.hex}
                      </span>
                    </div>
                    <div className={styles.InfoCard}>
                      <span className={styles.InfoCardLabel}>Type</span>
                      <span className={styles.InfoCardValue}>{stateRegisterControl.selectedRegisterInfo.type}</span>
                    </div>
                    <div className={styles.InfoCard}>
                      <span className={styles.InfoCardLabel}>Unit</span>
                      <span className={styles.InfoCardValue}>{stateRegisterControl.selectedRegisterInfo.unit}</span>
                    </div>
                    <div className={styles.InfoCard}>
                      <span className={styles.InfoCardLabel}>Valid Range</span>
                      <span className={styles.InfoCardValue}>{stateRegisterControl.selectedRegisterInfo.range}</span>
                    </div>
                  </div>

                  <div className={styles.InfoDescription}>
                    <strong>Description:</strong> {stateRegisterControl.selectedRegisterInfo.description}
                  </div>

                  <div className={styles.InputGroup}>
                    <label className={styles.InputLabel}>Value to Write</label>
                    <div className={styles.InputWrapper}>
                      <input
                        type="number"
                        className={styles.Input}
                        value={stateRegisterControl.writeValue}
                        onChange={handlers.handleWriteValueChange}
                        placeholder="Enter value..."
                      />
                      <span className={styles.InputUnit}>{stateRegisterControl.selectedRegisterInfo.unit}</span>
                    </div>
                  </div>

                  <button
                    className={styles.WriteButton}
                    onClick={handlers.handleWriteRegister}
                    disabled={stateRegisterControl.writing || !stateRegisterControl.writeValue}
                  >
                    {stateRegisterControl.writing ? (
                      <>
                        <span className={styles.Spinner}></span>
                        Writing...
                      </>
                    ) : (
                      <>
                        <span className={styles.ButtonIcon}>💾</span>
                        Write to Register
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {stateRegisterControl.writeResult && (
              <div className={`${styles.Notification} ${stateRegisterControl.writeResult.success ? styles.NotificationSuccess : styles.NotificationError}`}>
                <span className={styles.NotificationIcon}>
                  {stateRegisterControl.writeResult.success ? "✓" : "✕"}
                </span>
                <span className={styles.NotificationMessage}>{stateRegisterControl.writeResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {stateRegisterControl.error && (
        <div className={styles.ErrorNotification}>
          <span className={styles.ErrorIcon}>⚠️</span>
          {stateRegisterControl.error}
        </div>
      )}
    </div>
  );
}
