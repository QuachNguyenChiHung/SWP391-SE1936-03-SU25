/**
 * Date and DateTime utility functions for consistent formatting across the application
 * Display Format: DD/MM/YYYY HH:mm
 * Input Format: datetime-local (YYYY-MM-DDTHH:mm) or date (YYYY-MM-DD)
 */

/**
 * Format ISO datetime string to DD/MM/YYYY HH:mm
 * @param {string} isoString - ISO datetime string
 * @returns {string} Formatted datetime string (DD/MM/YYYY HH:mm)
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format ISO date string to DD/MM/YYYY (date only, no time)
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format ISO datetime string for datetime-local input (YYYY-MM-DDTHH:mm)
 * @param {string} isoString - ISO datetime string
 * @returns {string} Formatted datetime string for input (YYYY-MM-DDTHH:mm)
 */
export const formatDateTimeForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format ISO date string for date input (YYYY-MM-DD)
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string for input (YYYY-MM-DD)
 */
export const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Convert datetime-local input value (YYYY-MM-DDTHH:mm) to ISO string
 * Treats the input as local time and converts to UTC for backend
 * @param {string} datetimeLocal - datetime-local input value (YYYY-MM-DDTHH:mm)
 * @returns {string} ISO datetime string in UTC
 */
export const toIsoString = (datetimeLocal) => {
  if (!datetimeLocal) return '';
  // datetime-local is already in local time, just convert to ISO
  // The browser will handle the timezone conversion automatically
  return new Date(datetimeLocal).toISOString();
};

/**
 * Parse DD/MM/YYYY HH:mm to ISO string
 * @param {string} ddmmyyyyhhmm - Date string in DD/MM/YYYY HH:mm format
 * @returns {string} ISO datetime string
 */
export const parseDateTime = (ddmmyyyyhhmm) => {
  if (!ddmmyyyyhhmm) return '';
  const parts = ddmmyyyyhhmm.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!parts) return '';
  
  const [, day, month, year, hours, minutes] = parts;
  const date = new Date(year, month - 1, day, hours, minutes);
  
  return date.toISOString();
};

/**
 * Parse DD/MM/YYYY to ISO string
 * @param {string} ddmmyyyy - Date string in DD/MM/YYYY format
 * @returns {string} ISO date string
 */
export const parseDate = (ddmmyyyy) => {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!parts) return '';
  
  const [, day, month, year] = parts;
  const date = new Date(year, month - 1, day);
  
  return date.toISOString();
};
