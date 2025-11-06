import { useState } from "react";

const useLoadingSpinner = (initialProps) => {
  const [stateLoadingSpinner, setState] = useState({
    size: initialProps?.size || "medium",
    message: initialProps?.message || "Loading...",
  });

  const setLoadingSpinner = (field, value) => {
    if (typeof field === "object") {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateLoadingSpinner,
    setLoadingSpinner,
  };
};

export default useLoadingSpinner;
