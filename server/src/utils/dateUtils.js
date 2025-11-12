/**
 * Date utility functions for Thai timezone (ICT - UTC+7)
 */

/**
 * Get current timestamp in Thai timezone (ICT)
 * @returns {string} ISO 8601 formatted timestamp in Thai timezone
 */
function getThaiTimestamp() {
  const now = new Date();
  
  // Convert to Thai timezone (UTC+7)
  const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  
  // Format as ISO 8601 with timezone offset
  const year = thaiTime.getFullYear();
  const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const day = String(thaiTime.getDate()).padStart(2, '0');
  const hours = String(thaiTime.getHours()).padStart(2, '0');
  const minutes = String(thaiTime.getMinutes()).padStart(2, '0');
  const seconds = String(thaiTime.getSeconds()).padStart(2, '0');
  const milliseconds = String(thaiTime.getMilliseconds()).padStart(3, '0');
  
  // Return in format: YYYY-MM-DDTHH:mm:ss.sss+07:00
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

/**
 * Get current Date object in Thai timezone
 * @returns {Date} Date object adjusted to Thai timezone
 */
function getThaiDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}

/**
 * Convert any date to Thai timezone ISO string
 * @param {Date|string} date - Date to convert
 * @returns {string} ISO 8601 formatted timestamp in Thai timezone
 */
function toThaiTimestamp(date) {
  const inputDate = new Date(date);
  const thaiTime = new Date(inputDate.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  
  const year = thaiTime.getFullYear();
  const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const day = String(thaiTime.getDate()).padStart(2, '0');
  const hours = String(thaiTime.getHours()).padStart(2, '0');
  const minutes = String(thaiTime.getMinutes()).padStart(2, '0');
  const seconds = String(thaiTime.getSeconds()).padStart(2, '0');
  const milliseconds = String(thaiTime.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

module.exports = {
  getThaiTimestamp,
  getThaiDate,
  toThaiTimestamp
};
