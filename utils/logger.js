// utils/logger.js
// Secure logging utility that prevents sensitive data exposure

class SecureLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Sanitize data before logging to remove sensitive information
  sanitizeLogData(data) {
    if (!data) return data;
    
    if (typeof data === 'string') {
      // Remove potential tokens, passwords, and sensitive patterns
      return data
        .replace(/Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, 'Bearer [REDACTED]')
        .replace(/password['":\s]*['"]\w+['"]?/gi, 'password: "[REDACTED]"')
        .replace(/token['":\s]*['"]\w+['"]?/gi, 'token: "[REDACTED]"')
        .replace(/secret['":\s]*['"]\w+['"]?/gi, 'secret: "[REDACTED]"')
        .replace(/key['":\s]*['"]\w+['"]?/gi, 'key: "[REDACTED]"');
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'key', 'authorization'];
      
      for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }

    return data;
  }

  // Format log message with timestamp and context
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data: this.sanitizeLogData(data) }),
      ...(this.isProduction && { environment: 'production' })
    };

    return logEntry;
  }

  // Development-only logging
  debug(message, data = null) {
    if (this.isDevelopment) {
      const logEntry = this.formatMessage('debug', message, data);
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  // Information logging
  info(message, data = null) {
    const logEntry = this.formatMessage('info', message, data);
    console.log(JSON.stringify(logEntry, null, 2));
  }

  // Warning logging
  warn(message, data = null) {
    const logEntry = this.formatMessage('warn', message, data);
    console.warn(JSON.stringify(logEntry, null, 2));
  }

  // Error logging
  error(message, error = null, data = null) {
    const logEntry = this.formatMessage('error', message, {
      ...(error && {
        error: {
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
          name: error.name
        }
      }),
      ...data
    });
    console.error(JSON.stringify(logEntry, null, 2));
  }

  // Security event logging
  security(event, data = null) {
    const logEntry = this.formatMessage('security', `Security Event: ${event}`, data);
    console.warn(JSON.stringify(logEntry, null, 2));
    
    // In production, you might want to send this to a security monitoring service
    if (this.isProduction) {
      // TODO: Send to security monitoring service (e.g., Sentry, DataDog, etc.)
    }
  }

  // Performance logging
  performance(operation, duration, data = null) {
    const logEntry = this.formatMessage('performance', `Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...data
    });
    
    if (this.isDevelopment || duration > 1000) { // Log slow operations in production
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  // API request logging (sanitized)
  apiRequest(method, url, headers = {}, body = null) {
    if (!this.isDevelopment && !process.env.LOG_API_REQUESTS) return;

    const sanitizedHeaders = this.sanitizeLogData(headers);
    const sanitizedBody = this.sanitizeLogData(body);

    this.info('API Request', {
      method,
      url,
      headers: sanitizedHeaders,
      body: sanitizedBody
    });
  }

  // API response logging (sanitized)
  apiResponse(status, url, data = null) {
    if (!this.isDevelopment && !process.env.LOG_API_RESPONSES) return;

    const sanitizedData = this.sanitizeLogData(data);

    this.info('API Response', {
      status,
      url,
      data: sanitizedData
    });
  }
}

// Create singleton instance
const logger = new SecureLogger();

// Export both the class and instance
export { SecureLogger, logger };
export default logger;