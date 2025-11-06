import { useState } from "react";

const useDashboard = () => {
  const [stateDashboard, setState] = useState({
    pv1: {
      voltage: "0.00",
      current: "0.00",
      power: "0.00",
    },
    pv2: {
      voltage: "0.00",
      current: "0.00",
      power: "0.00",
    },
    totalPower: "0.00",
    loading: true,
    error: null,
    isPolling: false,
    lastUpdate: "Not yet updated",
  });

  const setDashboard = (field, value) => {
    if (typeof field === "object") {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  const toggleDashboardField = (field) => {
    setState((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  return {
    stateDashboard,
    setDashboard,
    toggleDashboardField,
  };
};

export default useDashboard;
