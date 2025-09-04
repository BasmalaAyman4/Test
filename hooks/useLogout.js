'use client';

import { useState, useCallback } from 'react';
import { AuthUtils } from '../utils/auth.utils.js';
import logger from '../utils/logger.js';

/**
 * Custom hook for logout functionality
 * Provides logout methods with loading states and error handling
 */
export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Standard logout
   */
  const logout = useCallback(async (options = {}) => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setError(null);
      
      await AuthUtils.logout(options);
      
    } catch (err) {
      logger.error('Logout hook error', err);
      setError(err.message || 'فشل في تسجيل الخروج');
      throw err;
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  /**
   * Logout with confirmation
   */
  const logoutWithConfirmation = useCallback(async (options = {}) => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setError(null);
      
      const result = await AuthUtils.logoutWithConfirmation(options);
      return result;
      
    } catch (err) {
      logger.error('Logout with confirmation error', err);
      setError(err.message || 'فشل في تسجيل الخروج');
      throw err;
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  /**
   * Force logout (for security)
   */
  const forceLogout = useCallback(async (reason = 'Security violation') => {
    try {
      setIsLoggingOut(true);
      setError(null);
      
      await AuthUtils.forceLogout(reason);
      
    } catch (err) {
      logger.error('Force logout error', err);
      setError(err.message || 'فشل في تسجيل الخروج الإجباري');
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    logout,
    logoutWithConfirmation,
    forceLogout,
    isLoggingOut,
    error,
    clearError
  };
};

export default useLogout;