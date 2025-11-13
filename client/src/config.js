// Environment configuration
// Create a .env file in the root with:
// REACT_APP_API_BASE_URL=http://localhost:5000

module.exports = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000",
  pollingInterval: 60000, // 60 seconds
  retryAttempts: 3,
  retryDelay: 30000, // 1 second
};
