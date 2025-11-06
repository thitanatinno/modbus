FROM node:18-alpine

# Install dependencies for serialport (native module compilation)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    udev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Run as non-root user (optional, comment out if you need root for serial access)
# RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# USER nodejs

# Start the application
CMD ["node", "index.js"]
