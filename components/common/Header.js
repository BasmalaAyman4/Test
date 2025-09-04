'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthUtils } from '../../utils/auth.utils.js';
import logger from '../../utils/logger.js';

const Header = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Auto logout setup
  useEffect(() => {
    if (session) {
      const cleanup = AuthUtils.setupAutoLogout(30 * 60 * 1000); // 30 minutes
      return cleanup;
    }
  }, [session]);

  /**
   * Handle logout with loading state
   */
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double clicks

    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);

      logger.info('Logout initiated from header');

      // Use the secure logout utility
      await AuthUtils.logoutWithConfirmation({
        callbackUrl: '/signin',
        redirect: true,
        message: 'هل أنت متأكد من تسجيل الخروج؟'
      });

    } catch (error) {
      logger.error('Header logout failed', error);
      
      // Show error message to user
      alert('حدث خطأ أثناء تسجيل الخروج. سيتم إعادة المحاولة...');
      
      // Force logout as fallback
      await AuthUtils.forceLogout('Logout error fallback');
      
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Quick logout without confirmation (for security)
   */
  const handleQuickLogout = async () => {
    try {
      setIsLoggingOut(true);
      await AuthUtils.logout({
        callbackUrl: '/signin',
        redirect: true
      });
    } catch (error) {
      await AuthUtils.forceLogout('Quick logout fallback');
    }
  };

  /**
   * Handle profile navigation
   */
  const handleProfileClick = () => {
    setShowUserMenu(false);
    router.push('/profile');
  };

  /**
   * Handle settings navigation
   */
  const handleSettingsClick = () => {
    setShowUserMenu(false);
    router.push('/settings');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <header className="header-loading">
        <div className="container">
          <div className="header-skeleton">
            <div className="logo-skeleton"></div>
            <div className="user-skeleton"></div>
          </div>
        </div>
      </header>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>LaJolie</h1>
            </div>
            <nav className="nav-links">
              <a href="/signin" className="btn btn-primary">
                تسجيل الدخول
              </a>
              <a href="/signup" className="btn btn-secondary">
                إنشاء حساب
              </a>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  // Authenticated user
  return (
    <header className="header authenticated">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo">
            <h1 onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              LaJolie
            </h1>
          </div>

          {/* Navigation */}
          <nav className="main-nav">
            <a href="/" className="nav-link">الرئيسية</a>
            <a href="/products" className="nav-link">المنتجات</a>
            <a href="/categories" className="nav-link">التصنيفات</a>
            <a href="/orders" className="nav-link">طلباتي</a>
          </nav>

          {/* User Menu */}
          <div className="user-menu">
            <div 
              className="user-profile"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-info">
                <span className="user-name">
                  {session.user?.firstName} {session.user?.lastName}
                </span>
                <span className="user-mobile">
                  {session.user?.mobile}
                </span>
              </div>
              <div className="user-avatar">
                {session.user?.firstName?.charAt(0)}{session.user?.lastName?.charAt(0)}
              </div>
              <svg 
                className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`}
                width="12" 
                height="12" 
                viewBox="0 0 12 12"
              >
                <path d="M6 8L2 4h8L6 8z" fill="currentColor"/>
              </svg>
            </div>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={handleProfileClick}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  الملف الشخصي
                </button>

                <button 
                  className="dropdown-item"
                  onClick={handleSettingsClick}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                  الإعدادات
                </button>

                <div className="dropdown-divider"></div>

                <button 
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  {isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="menu-overlay"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;