# 🚪 Secure Logout Implementation Guide

## 🎯 Complete Logout Solution

This guide shows you how to implement secure logout functionality in your header component and throughout your application.

## 🏗️ Files Created

### **1. Core Utilities**
- `utils/auth.utils.js` - Comprehensive authentication utilities
- `hooks/useLogout.js` - React hook for logout functionality
- `components/common/Header.js` - Header component with logout
- `styles/Header.css` - Styling for the header component

### **2. Enhanced NextAuth Configuration**
- Updated `app/api/auth/[...nextauth]/route.js` with proper server-side cleanup

## 🚀 How to Use

### **Method 1: Using the Header Component (Recommended)**

Import and use the header component in your layout:

```jsx
// app/layout.js or components/Layout.js
import Header from '../components/common/Header';
import '../styles/Header.css';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### **Method 2: Using the useLogout Hook**

For custom logout buttons anywhere in your app:

```jsx
'use client';

import { useLogout } from '../hooks/useLogout';

const CustomLogoutButton = () => {
  const { logout, logoutWithConfirmation, isLoggingOut, error } = useLogout();

  const handleLogout = async () => {
    try {
      await logoutWithConfirmation({
        message: 'هل أنت متأكد من تسجيل الخروج؟',
        callbackUrl: '/signin'
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      disabled={isLoggingOut}
      className="logout-btn"
    >
      {isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
    </button>
  );
};
```

### **Method 3: Using AuthUtils Directly**

For programmatic logout:

```jsx
'use client';

import { AuthUtils } from '../utils/auth.utils';

// Simple logout
const handleQuickLogout = async () => {
  await AuthUtils.logout({
    callbackUrl: '/signin',
    redirect: true
  });
};

// Logout with confirmation
const handleConfirmLogout = async () => {
  await AuthUtils.logoutWithConfirmation({
    message: 'هل تريد تسجيل الخروج؟',
    callbackUrl: '/signin'
  });
};

// Force logout (for security violations)
const handleForceLogout = async () => {
  await AuthUtils.forceLogout('Security violation detected');
};
```

## 🔐 Security Features

### **✅ What the Logout Does:**

1. **Server-Side Token Invalidation**
   - Calls your API to invalidate the access token
   - Uses the correct endpoint: `/Auth/refreshToken`
   - Handles API failures gracefully

2. **Client-Side Cleanup**
   - Clears all NextAuth cookies
   - Removes localStorage items
   - Clears sessionStorage
   - Removes browser caches
   - Clears application-specific data

3. **Security Features**
   - Confirmation dialogs to prevent accidental logout
   - Force logout for security violations
   - Auto-logout after inactivity (30 minutes default)
   - Secure logging without exposing sensitive data
   - Error handling with fallback mechanisms

4. **User Experience**
   - Loading states during logout
   - Error messages in Arabic
   - Smooth animations and transitions
   - Mobile-responsive design
   - Accessible keyboard navigation

## 🎨 Header Component Features

### **For Authenticated Users:**
- User profile display with name and mobile
- Dropdown menu with profile, settings, and logout
- Beautiful gradient background
- Hover effects and animations
- Auto-logout setup (30 minutes inactivity)

### **For Non-Authenticated Users:**
- Clean login/signup buttons
- Responsive design
- Call-to-action styling

### **Loading States:**
- Skeleton loading during session check
- Logout button loading state
- Smooth transitions

## ⚙️ Configuration Options

### **Logout Options:**
```javascript
const logoutOptions = {
  callbackUrl: '/signin',        // Where to redirect after logout
  redirect: true,                // Whether to redirect automatically
  clearStorage: true,            // Whether to clear client storage
  message: 'هل تريد الخروج؟'      // Confirmation message (Arabic)
};
```

### **Auto-Logout Configuration:**
```javascript
// Setup auto-logout (in useEffect)
useEffect(() => {
  if (session) {
    const cleanup = AuthUtils.setupAutoLogout(30 * 60 * 1000); // 30 minutes
    return cleanup; // Cleanup on unmount
  }
}, [session]);
```

## 🎯 Usage Examples

### **1. Simple Header Usage**
```jsx
'use client';

import Header from '../components/common/Header';
import { SessionProvider } from 'next-auth/react';

function App() {
  return (
    <SessionProvider>
      <Header />
      {/* Your app content */}
    </SessionProvider>
  );
}
```

### **2. Custom Logout Button**
```jsx
'use client';

import { useLogout } from '../hooks/useLogout';

function LogoutButton() {
  const { logoutWithConfirmation, isLoggingOut } = useLogout();

  return (
    <button 
      onClick={() => logoutWithConfirmation()}
      disabled={isLoggingOut}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      {isLoggingOut ? 'خروج...' : 'تسجيل الخروج'}
    </button>
  );
}
```

### **3. Emergency Logout (Security)**
```jsx
'use client';

import { AuthUtils } from '../utils/auth.utils';

// Use this for security violations
const handleSecurityViolation = async () => {
  await AuthUtils.forceLogout('Suspicious activity detected');
};
```

## 🔧 Customization

### **Styling the Header:**
The header uses CSS classes that you can customize:

```css
/* Custom styles in your CSS file */
.header.authenticated {
  background: your-custom-gradient;
}

.user-profile:hover {
  transform: your-custom-transform;
}

.dropdown-menu {
  border-radius: your-custom-radius;
}
```

### **Custom Confirmation Dialog:**
```javascript
const customLogout = async () => {
  const confirmed = window.confirm('Are you sure you want to logout?');
  if (confirmed) {
    await AuthUtils.logout({ callbackUrl: '/login' });
  }
};
```

## 🐛 Error Handling

The logout system includes comprehensive error handling:

```javascript
try {
  await AuthUtils.logout();
} catch (error) {
  // Automatic fallback to force logout
  console.error('Logout failed, forcing logout:', error);
  await AuthUtils.forceLogout('Logout error fallback');
}
```

## 📱 Mobile Support

The header is fully responsive:
- Collapsible navigation on mobile
- Touch-friendly buttons
- Optimized dropdown positioning
- Swipe gestures support

## ♿ Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Reduced motion support
- Focus management

## 🔍 Testing Your Logout

### **Manual Testing:**
1. Login to your application
2. Click the logout button in the header
3. Confirm the logout in the dialog
4. Verify redirect to signin page
5. Try to access protected pages (should redirect to login)

### **Security Testing:**
1. Check that tokens are invalidated on the server
2. Verify that localStorage is cleared
3. Test auto-logout after inactivity
4. Test force logout functionality

## 🚨 Security Best Practices

✅ **Always use HTTPS in production**  
✅ **Set strong NEXTAUTH_SECRET**  
✅ **Enable secure cookies**  
✅ **Implement auto-logout**  
✅ **Clear all client storage**  
✅ **Log security events**  
✅ **Handle logout failures gracefully**  

## 🎉 You're All Set!

Your logout functionality is now:
- ✅ **Secure**: Proper token invalidation
- ✅ **User-Friendly**: Beautiful UI with confirmations
- ✅ **Robust**: Error handling and fallbacks
- ✅ **Accessible**: Mobile and keyboard friendly
- ✅ **Production-Ready**: Performance optimized

Just import the Header component and you're ready to go! 🚀