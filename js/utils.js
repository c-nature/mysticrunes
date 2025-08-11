/**
 * Utility Functions
 * Common utility functions used throughout the Mythic Runes game
 */

class Utils {
  /**
   * Debounces a function call to prevent excessive executions
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttles a function call to limit execution frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Sanitizes user input to prevent XSS and ensure valid format
   * @param {string} input - User input to sanitize
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '') // Only allow letters
      .slice(0, GAME_CONFIG.MAX_WORD_LENGTH);
  }

  /**
   * Validates that input contains only allowed characters
   * @param {string} input - Input to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static isValidInput(input) {
    if (typeof input !== 'string') return false;
    if (input.length < GAME_CONFIG.MIN_WORD_LENGTH) return false;
    if (input.length > GAME_CONFIG.MAX_WORD_LENGTH) return false;
    return /^[a-zA-Z]+$/.test(input);
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} New shuffled array (original unchanged)
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Formats time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  /**
   * Creates a delay using Promise
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safely gets an element by ID with error handling
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} Element or null if not found
   */
  static safeGetElement(id) {
    try {
      const element = document.getElementById(id);
      if (!element) {
        Logger.warn(`Element with ID '${id}' not found`);
      }
      return element;
    } catch (error) {
      Logger.error(`Error getting element '${id}':`, error);
      return null;
    }
  }

  /**
   * Safely gets elements by class name with error handling
   * @param {string} className - Class name
   * @returns {NodeList|Array} Elements or empty array if not found
   */
  static safeGetElementsByClass(className) {
    try {
      const elements = document.getElementsByClassName(className);
      return Array.from(elements);
    } catch (error) {
      Logger.error(`Error getting elements by class '${className}':`, error);
      return [];
    }
  }

  /**
   * Announces message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  static announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, GAME_CONFIG.ANIMATION_DELAYS.MESSAGE_DURATION);
  }

  /**
   * Capitalizes the first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  static capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Formats a message template with variables
   * @param {string} template - Message template with {variable} placeholders
   * @param {Object} variables - Object with variable values
   * @returns {string} Formatted message
   */
  static formatMessage(template, variables = {}) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables.hasOwnProperty(key) ? variables[key] : match;
    });
  }

  /**
   * Checks if the user prefers reduced motion
   * @returns {boolean} True if reduced motion is preferred
   */
  static prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Checks if the user prefers high contrast
   * @returns {boolean} True if high contrast is preferred
   */
  static prefersHighContrast() {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Gets the user's preferred color scheme
   * @returns {string} 'dark', 'light', or 'no-preference'
   */
  static getPreferredColorScheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'no-preference';
  }

  /**
   * Checks if touch is supported
   * @returns {boolean} True if touch is supported
   */
  static isTouchSupported() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Gets viewport dimensions
   * @returns {Object} Object with width and height properties
   */
  static getViewportDimensions() {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }

  /**
   * Checks if an element is visible in the viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is visible
   */
  static isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewport = this.getViewportDimensions();
    
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewport.height &&
      rect.right <= viewport.width
    );
  }

  /**
   * Smoothly scrolls an element into view
   * @param {HTMLElement} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  static scrollIntoView(element, options = {}) {
    if (!element) return;
    
    const defaultOptions = {
      behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  }

  /**
   * Copies text to clipboard with fallback
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Promise that resolves to success status
   */
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      Logger.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Generates a random ID string
   * @param {number} length - Length of the ID
   * @returns {string} Random ID string
   */
  static generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Deep clones an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }

  /**
   * Checks if two objects are deeply equal
   * @param {*} obj1 - First object
   * @param {*} obj2 - Second object
   * @returns {boolean} True if objects are equal
   */
  static deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!this.deepEqual(obj1[key], obj2[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
}

/**
 * Logger utility for consistent logging throughout the application
 */
class Logger {
  static log(level, message, ...args) {
    if (!GAME_CONFIG.DEBUG.ENABLED) return;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = GAME_CONFIG.DEBUG.LOG_LEVEL;
    const configLevelIndex = levels.indexOf(configLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    if (currentLevelIndex >= configLevelIndex) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, ...args);
          break;
        case 'info':
          console.info(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        case 'error':
          console.error(prefix, message, ...args);
          break;
        default:
          console.log(prefix, message, ...args);
      }
    }
  }

  static debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  static info(message, ...args) {
    this.log('info', message, ...args);
  }

  static warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  static error(message, ...args) {
    this.log('error', message, ...args);
  }
}

/**
 * Storage utility for managing localStorage with error handling
 */
class Storage {
  /**
   * Safely gets an item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Stored value or default value
   */
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      Logger.error(`Error reading from localStorage key '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Safely sets an item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} True if successful, false otherwise
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      Logger.error(`Error writing to localStorage key '${key}':`, error);
      if (error.name === 'QuotaExceededError') {
        Logger.warn('localStorage quota exceeded, attempting to clear old data');
        this.clearOldData();
        // Try again after clearing
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          Logger.error('Failed to store data even after clearing:', retryError);
        }
      }
      return false;
    }
  }

  /**
   * Safely removes an item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if successful, false otherwise
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      Logger.error(`Error removing localStorage key '${key}':`, error);
      return false;
    }
  }

  /**
   * Clears old data from localStorage to free up space
   */
  static clearOldData() {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith('mythic_runes_'));
      
      // Remove old cache entries first
      gameKeys.forEach(key => {
        if (key.includes('cache') || key.includes('temp')) {
          localStorage.removeItem(key);
        }
      });
      
      Logger.info('Cleared old localStorage data');
    } catch (error) {
      Logger.error('Error clearing old localStorage data:', error);
    }
  }

  /**
   * Gets the approximate size of localStorage usage
   * @returns {number} Size in bytes (approximate)
   */
  static getUsage() {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      Logger.error('Error calculating localStorage usage:', error);
      return 0;
    }
  }
}

// Export utilities if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Utils, Logger, Storage };
}