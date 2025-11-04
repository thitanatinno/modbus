const ModbusRTU = require('modbus-serial');
const config = require('./config');

// Create Modbus RTU client
const client = new ModbusRTU();

// Connect and test reading coils
async function testCoils() {
  try {
    console.log(`Connecting to ${config.serial.port}...`);
    console.log(`Configuration:`, {
      port: config.serial.port,
      baudRate: config.serial.baudRate,
      dataBits: config.serial.dataBits,
      stopBits: config.serial.stopBits,
      parity: config.serial.parity,
      slaveId: config.modbus.slaveId,
      timeout: config.modbus.timeout
    });
    
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
    console.log(`\nTesting coil reads...`);
    console.log('-----------------------------------\n');
    
    // Test different address ranges
    const testRanges = [
      { start: 0, count: 7, desc: 'Coils 0-6' },
      { start: 604, count: 7, desc: 'Coils 604-610' },
      { start: 0, count: 1, desc: 'Single coil 0' }
    ];
    
    for (const range of testRanges) {
      console.log(`\nTesting ${range.desc}...`);
      try {
        const data = await client.readCoils(range.start, range.count);
        console.log(`✓ SUCCESS: ${range.desc}`);
        console.log(`  Values:`, data.data);
      } catch (error) {
        console.log(`✗ FAILED: ${range.desc}`);
        console.log(`  Error: ${error.message}`);
      }
    }
    
    console.log('\n-----------------------------------');
    console.log('Test complete!');
    
    client.close(() => {
      console.log('Connection closed');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Connection error:', error.message);
    process.exit(1);
  }
}

// Run test
testCoils();
