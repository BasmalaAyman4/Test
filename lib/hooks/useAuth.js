"use client";
import { useState, useCallback, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { checkRateLimit } from '@/utils/validation';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const abortControllerRef = useRef(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (mobile, password, langCode = '1') => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      // Check rate limiting
      const rateLimitCheck = await checkRateLimit(`login:${mobile}`);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message);
        return { success: false, error: rateLimitCheck.message };
      }

      console.log('Starting login process...');

      // Call login service
      const response = await AuthService.loginWithPassword(mobile, password, langCode);

      if (response.success) {
        console.log('API login successful, now signing in with NextAuth...');

        // Sign in with NextAuth
        const result = await signIn("credentials", {
          redirect: false,
          id: response.user.userId,
          mobile: response.user.lastMobileDigit || mobile,
          token: response.user.token,
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          address: response.user.address || null
        });

        console.log('NextAuth signin result:', result);

        if (result?.error) {
          console.error('NextAuth signin error:', result.error);
          setError('فشل في تسجيل الدخول - خطأ في النظام');
          return { success: false, error: 'فشل في تسجيل الدخول - خطأ في النظام' };
        }

        if (result?.ok) {
          console.log('Login successful, redirecting...');

          // Small delay to ensure session is established
          setTimeout(() => {
            // Get the callback URL or redirect to home
            const urlParams = new URLSearchParams(window.location.search);
            const callbackUrl = urlParams.get('callbackUrl');
            const redirectUrl = callbackUrl || `/${langCode === '2' ? 'en' : 'ar'}`;

            console.log('Redirecting to:', redirectUrl);
            router.push(redirectUrl);
          }, 100);

          return { success: true };
        } else {
          setError('فشل في تسجيل الدخول');
          return { success: false, error: 'فشل في تسجيل الدخول' };
        }
      } else {
        console.error('API login failed:', response.error);
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      console.error('Login exception:', err);

      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ غير متوقع";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, router]);

  const signup = useCallback(async (mobile, langCode = '1') => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const rateLimitCheck = await checkRateLimit(`signup:${mobile}`);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message);
        return { success: false, error: rateLimitCheck.message };
      }

      const response = await AuthService.signUpWithMobile(mobile, langCode);

      if (response.success) {
        return { success: true, userId: response.user };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في التسجيل";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const verifyOTP = useCallback(async (userId, otp, langCode = '1') => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const rateLimitCheck = await checkRateLimit(`otp:${userId}`);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message);
        return { success: false, error: rateLimitCheck.message };
      }

      const response = await AuthService.verifyOTP(userId, otp, langCode);

      if (response.success) {
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في التحقق";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const setPassword = useCallback(async (userId, password, langCode = '1') => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await AuthService.setPassword(userId, password, langCode);

      if (response.success) {
        return { success: true, userData: response.userData };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في تعيين كلمة المرور";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const setPersonalInfo = useCallback(async (token, personalData, langCode = '1') => {
    if (loading) return { success: false, error: 'طلب قيد التنفيذ' };

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await AuthService.setPersonalInfo(token, personalData, langCode);

      if (response.success) {
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'تم إلغاء الطلب' };
      }

      const errorMsg = "حدث خطأ في حفظ البيانات الشخصية";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading]);

  const cancelRequest = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    loading,
    error,
    clearError,
    login,
    signup,
    verifyOTP,
    setPassword,
    setPersonalInfo,
    cancelRequest
  };
};