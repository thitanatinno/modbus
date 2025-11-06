import React from "react";
import styles from "./LoadingSpinner.module.scss";
import useLoadingSpinner from "./useLoadingSpinner";
import LoadingSpinnerHandler from "./LoadingSpinnerHandler";

export default function LoadingSpinner({ size = "medium", message = "Loading..." }) {
  const { stateLoadingSpinner, setLoadingSpinner } = useLoadingSpinner({ size, message });
  const handlers = LoadingSpinnerHandler(stateLoadingSpinner, setLoadingSpinner);

  return (
    <div className={styles.Container}>
      <div className={`${styles.Spinner} ${styles[stateLoadingSpinner.size]}`}></div>
      {stateLoadingSpinner.message && (
        <p className={styles.Message}>{stateLoadingSpinner.message}</p>
      )}
    </div>
  );
}
