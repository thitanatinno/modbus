// Environment configuration
// Create a .env file in the root with:
// REACT_APP_API_BASE_URL=http://localhost:3000

module.exports = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:3000",
  pollingInterval: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};
