/**
 * Logger utility for development and production
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  
  success: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]) => {
    // Always log errors, even in production
    console.error(`❌ ${message}`, ...args);
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment && import.meta.env.VITE_DEBUG) {
      console.debug(`🔍 ${message}`, ...args);
    }
  }
};
