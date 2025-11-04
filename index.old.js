const ModbusRTU = require('modbus-serial');
const config = require('./config');

// Create Modbus RTU client
const client = new ModbusRTU();

// Connect to RS485 serial port
async function connect() {
  try {
    console.log(`Connecting to ${config.serial.port}...`);
    
    await client.connectRTUBuffered(config.serial.port, {
      baudRate: config.serial.baudRate,
      dataBits: config.serial.dataBits,
      stopBits: config.serial.stopBits,
      parity: config.serial.parity
    });
    
    // Set Modbus slave ID
    client.setID(config.modbus.slaveId);
    
    // Set timeout
    client.setTimeout(config.modbus.timeout);
    
    console.log('Connected successfully!');
    console.log(`Reading from Slave ID: ${config.modbus.slaveId}`);
    console.log(`Register Address: ${config.reading.registerAddress}`);
    console.log(`Register Count: ${config.reading.registerCount}`);
    console.log('-----------------------------------\n');
    
    return true;
  } catch (error) {
    console.error('Connection error:', error.message);
    return false;
  }
}

// Read holding registers
async function readHoldingRegisters() {
  try {
    const data = await client.readHoldingRegisters(
      config.reading.registerAddress,
      config.reading.registerCount
    );
    
    console.log(`[${new Date().toISOString()}] Read successful:`);
    console.log('Register values:', data.data);
    
    // Display individual register values
    data.data.forEach((value, index) => {
      const registerAddr = config.reading.registerAddress + index;
      console.log(`  Register ${registerAddr}: ${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`);
    });
    
    console.log('-----------------------------------\n');
    
    return data.data;
  } catch (error) {
    console.error('Read error:', error.message);
    return null;
  }
}

// Read input registers
async function readInputRegisters() {
  try {
    const data = await client.readInputRegisters(
      config.reading.registerAddress,
      config.reading.registerCount
    );
    
    console.log(`[${new Date().toISOString()}] Read successful:`);
    console.log('Input register values:', data.data);
    
    data.data.forEach((value, index) => {
      const registerAddr = config.reading.registerAddress + index;
      console.log(`  Input Register ${registerAddr}: ${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`);
    });
    
    console.log('-----------------------------------\n');
    
    return data.data;
  } catch (error) {
    console.error('Read error:', error.message);
    return null;
  }
}

// Read coils (discrete outputs)
async function readCoils() {
  try {
    const data = await client.readCoils(
      config.reading.registerAddress,
      config.reading.registerCount
    );
    
    console.log(`[${new Date().toISOString()}] Read coils successful:`);
    console.log('Coil values:', data.data);
    
    console.log('-----------------------------------\n');
    
    return data.data;
  } catch (error) {
    console.error('Read coils error:', error.message);
    return null;
  }
}

// Main polling loop
async function startPolling() {
  setInterval(async () => {
    // // Read holding registers (most common for meters)
    // await readHoldingRegisters();
    
    // // Uncomment below to read input registers instead
    //  await readInputRegisters();
    
    // Uncomment below to read coils
     await readCoils();
  }, config.reading.interval);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nClosing connection...');
  client.close(() => {
    console.log('Connection closed');
    process.exit(0);
  });
});

// Main function
async function main() {
  const connected = await connect();
  
  if (connected) {
    // Read immediately on startup
    await readHoldingRegisters();
    
    // Start continuous polling
    startPolling();
  } else {
    console.error('Failed to connect. Please check your configuration and RS485 connection.');
    process.exit(1);
  }
}

// Run the program
main();
