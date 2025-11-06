const MeterCardHandler = (stateMeterCard, setMeterCard) => {
  return {
    handleMouseEnter: () => {
      setMeterCard("isHovered", true);
    },
    
    handleMouseLeave: () => {
      setMeterCard("isHovered", false);
    },
  };
};

export default MeterCardHandler;
