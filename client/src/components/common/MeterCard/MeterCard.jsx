import React from "react";
import styles from "./MeterCard.module.scss";
import useMeterCard from "./useMeterCard";
import MeterCardHandler from "./MeterCardHandler";

export default function MeterCard({ title, value, unit, status, icon }) {
  const { stateMeterCard, setMeterCard } = useMeterCard({ 
    title, 
    value, 
    unit, 
    status 
  });
  const handlers = MeterCardHandler(stateMeterCard, setMeterCard);

  return (
    <div 
      className={`${styles.Container} ${stateMeterCard.isHovered ? styles.Hovered : ''}`}
      onMouseEnter={handlers.handleMouseEnter}
      onMouseLeave={handlers.handleMouseLeave}
    >
      <div className={styles.Header}>
        {icon && <div className={styles.Icon}>{icon}</div>}
        <h3 className={styles.Title}>{stateMeterCard.title}</h3>
      </div>
      
      <div className={styles.ValueSection}>
        <span className={styles.Value}>{stateMeterCard.value}</span>
        <span className={styles.Unit}>{stateMeterCard.unit}</span>
      </div>
      
      {stateMeterCard.status && (
        <div className={`${styles.Status} ${styles[stateMeterCard.status]}`}>
          {stateMeterCard.status}
        </div>
      )}
    </div>
  );
}
