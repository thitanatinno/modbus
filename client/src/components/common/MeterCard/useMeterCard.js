import { useState, useEffect } from "react";

const useMeterCard = (initialProps) => {
  const [stateMeterCard, setState] = useState({
    title: initialProps?.title || "",
    value: initialProps?.value || "0",
    unit: initialProps?.unit || "",
    status: initialProps?.status || "",
    isHovered: false,
  });

  const setMeterCard = (field, value) => {
    if (typeof field === "object") {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  const toggleMeterCardField = (field) => {
    setState((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  // Update state when props change
  useEffect(() => {
    if (initialProps) {
      setMeterCard({
        title: initialProps.title || stateMeterCard.title,
        value: initialProps.value || stateMeterCard.value,
        unit: initialProps.unit || stateMeterCard.unit,
        status: initialProps.status || stateMeterCard.status,
      });
    }
  }, [initialProps?.value, initialProps?.status]);

  return {
    stateMeterCard,
    setMeterCard,
    toggleMeterCardField,
  };
};

export default useMeterCard;
