// utils/auth.utils.js
'use client';

import { signOut } from 'next-auth/react';
import logger from './logger.js';

/**
 * Secure logout utility with comprehensive cleanup
 */
export class AuthUtils {
  /**
   * Perform secure logout with server-side token invalidation
   * @param {Object} options - Logout options
   * @param {string} options.callbackUrl - URL to redirect after logout
   * @param {boolean} options.redirect - Whether to redirect after logout
   * @returns {Promise<void>}
   */
  static async logout(options = {}) {
    const {
      callbackUrl = '/signin',
      redirect = true,
      clearStorage = true
    } = options;

    try {
      logger.info('User logout initiated');

      // Clear any client-side storage
      if (clearStorage) {
        await AuthUtils.clearClientStorage();
      }

      // Sign out using NextAuth
      await signOut({
        callbackUrl,
        redirect
      });

      logger.info('User logout completed successfully');
      
    } catch (error) {
      logger.error('Logout failed', error);
      
      // Even if logout fails, clear client storage and redirect
      if (clearStorage) {
        await AuthUtils.clearClientStorage();
      }
      
      if (redirect) {
        window.location.href = callbackUrl;
      }
      
      throw error;
    }
  }

  /**
   * Clear all client-side storage
   */
  static async clearClientStorage() {
    try {
      // Clear localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        // Remove specific auth-related items
        const authKeys = [
          'next-auth.session-token',
          'next-auth.csrf-token',
          'next-auth.callback-url',
          'profile-completed',
          'user-preferences',
          'cart-items',
          'recent-searches'
        ];

        authKeys.forEach(key => {
          localStorage.removeItem(key);
        });

        logger.debug('Client storage cleared');
      }

      // Clear sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.clear();
      }

      // Clear any application-specific caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

    } catch (error) {
      logger.error('Failed to clear client storage', error);
    }
  }

  /**
   * Logout with confirmation dialog
   * @param {Object} options - Logout options
   * @returns {Promise<void>}
   */
  static async logoutWithConfirmation(options = {}) {
    const {
      message = 'هل أنت متأكد من تسجيل الخروج؟',
      confirmText = 'نعم، تسجيل الخروج',
      cancelText = 'إلغاء'
    } = options;

    return new Promise((resolve, reject) => {
      // Create custom confirmation dialog
      const confirmed = window.confirm(message);
      
      if (confirmed) {
        AuthUtils.logout(options)
          .then(resolve)
          .catch(reject);
      } else {
        logger.debug('Logout cancelled by user');
        resolve(false);
      }
    });
  }

  /**
   * Force logout (for security incidents)
   * Clears everything and redirects immediately
   */
  static async forceLogout(reason = 'Security violation') {
    try {
      logger.security('Force logout triggered', { reason });

      // Clear all storage immediately
      await AuthUtils.clearClientStorage();

      // Clear all cookies
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }

      // Redirect immediately without NextAuth cleanup (faster)
      window.location.href = '/signin?error=SecurityViolation';
      
    } catch (error) {
      logger.error('Force logout failed', error);
      // Fallback: hard refresh
      window.location.reload();
    }
  }

  /**
   * Check if user is authenticated (client-side)
   * @returns {boolean}
   */
  static isAuthenticated() {
    if (typeof window === 'undefined') return false;

    // Check for NextAuth session cookie
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith('next-auth.session-token=') ||
      cookie.trim().startsWith('__Secure-next-auth.session-token=')
    );

    return !!sessionCookie;
  }

  /**
   * Get current user info from session storage (if available)
   * @returns {Object|null}
   */
  static getCurrentUser() {
    if (typeof window === 'undefined') return null;

    try {
      const userInfo = localStorage.getItem('current-user');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      logger.error('Failed to get current user', error);
      return null;
    }
  }

  /**
   * Auto logout after inactivity
   * @param {number} timeoutMs - Timeout in milliseconds (default: 30 minutes)
   */
  static setupAutoLogout(timeoutMs = 30 * 60 * 1000) {
    if (typeof window === 'undefined') return;

    let timeoutId;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logger.security('Auto logout due to inactivity');
        AuthUtils.logout({
          callbackUrl: '/signin?error=SessionTimeout'
        });
      }, timeoutMs);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Initial timeout
    resetTimeout();

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }
}

// Export individual functions for convenience
export const {
  logout,
  logoutWithConfirmation,
  forceLogout,
  clearClientStorage,
  isAuthenticated,
  getCurrentUser,
  setupAutoLogout
} = AuthUtils;

export default AuthUtils;