/**
 * Logger configuration using Pino
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logPretty = process.env.LOG_PRETTY === 'true';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment && logPretty ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
