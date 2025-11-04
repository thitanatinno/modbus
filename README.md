# Modbus RS485 Reader

A simple Node.js application to read Modbus values through RS485 serial communication.

## Prerequisites

- Node.js (v14 or higher)
- RS485 to USB adapter connected to your computer
- Modbus RTU slave device (e.g., energy meter, sensor, etc.)

## Installation

1. Install dependencies:
```bash
npm install
```

## Configuration

Edit `config.js` to match your setup:

### Serial Port Settings
```javascript
serial: {
  port: '/dev/ttyUSB0',  // Your RS485 port
  baudRate: 9600,        // Match your device's baud rate
  dataBits: 8,
  stopBits: 1,
  parity: 'none'         // Options: 'none', 'even', 'odd'
}
```

**Finding your serial port:**
- **Linux/Mac**: Usually `/dev/ttyUSB0`, `/dev/ttyUSB1`, or `/dev/ttyAMA0`
- **Windows**: Usually `COM3`, `COM4`, etc.

To list available ports on Linux/Mac:
```bash
ls /dev/tty*
```

### Modbus Settings
```javascript
modbus: {
  slaveId: 1,      // Your device's Modbus slave ID
  timeout: 1000,   // Response timeout in ms
  retries: 3       // Number of retries
}
```

### Reading Settings
```javascript
reading: {
  registerAddress: 0,    // Starting register address
  registerCount: 10,     // Number of registers to read
  interval: 5000         // Polling interval (5 seconds)
}
```

## Usage

### Start the program:
```bash
npm start
```

### Development mode (auto-restart on changes):
```bash
npm run dev
```

## Reading Different Register Types

The program supports three types of Modbus reads:

1. **Holding Registers** (default) - Function Code 0x03
   - Most common for reading/writing data
   - Used by most meters and sensors
   
2. **Input Registers** - Function Code 0x04
   - Read-only registers
   - Often used for sensor readings

3. **Coils** - Function Code 0x01
   - Read discrete outputs (on/off values)

To change the register type, edit `index.js` and uncomment the desired function in the `startPolling()` function.

## Output Example

```
Connecting to /dev/ttyUSB0...
Connected successfully!
Reading from Slave ID: 1
Register Address: 0
Register Count: 10
-----------------------------------

[2024-11-04T10:30:15.123Z] Read successful:
Register values: [ 230, 1500, 50, 0, 0, 0, 0, 0, 0, 0 ]
  Register 0: 230 (0x00E6)
  Register 1: 1500 (0x05DC)
  Register 2: 50 (0x0032)
  Register 3: 0 (0x0000)
  ...
-----------------------------------
```

## Troubleshooting

### Permission Denied (Linux/Mac)
Add your user to the dialout group:
```bash
sudo usermod -a -G dialout $USER
```
Then log out and back in.

Or use sudo:
```bash
sudo npm start
```

### Connection Timeout
- Check physical RS485 connections (A, B, GND)
- Verify correct baud rate and parity settings
- Ensure correct slave ID
- Check if the device is powered on

### No Response
- Verify the register address exists on your device
- Check the device's Modbus register map documentation
- Try reading a different register address
- Reduce the number of registers to read

### Common Baud Rates
- 9600 (most common)
- 19200
- 38400
- 115200

## Wiring RS485

Typical RS485 wiring:
```
Modbus Device    RS485 Adapter
    A (D+)  <-->  A (D+)
    B (D-)  <-->  B (D-)
    GND     <-->  GND (if available)
```

## License

ISC
# modbus
# modbus
