// utils/validation.js
import { rateLimit } from './rate-limit.js';
import { SecurityUtils } from './security.utils.js';
import { SECURITY_CONFIG } from '../config/security.config.js';

// Enhanced mobile validation for Egyptian numbers with security
export const validateMobile = (mobile) => {
    if (!mobile || typeof mobile !== 'string') return false;

    // Sanitize input first
    const sanitizedMobile = SecurityUtils.sanitizeInput(mobile);
    
    // Remove all spaces and special characters
    const cleanMobile = sanitizedMobile.replace(/[\s\-\(\)]/g, '');

    // Validate length to prevent DoS
    if (cleanMobile.length > 20) return false;

    // Egyptian mobile patterns from security config
    return SECURITY_CONFIG.VALIDATION.MOBILE_PATTERNS.some(pattern => 
        pattern.test(cleanMobile)
    );
};

// Enhanced password validation with strength checking
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        return { isValid: false, message: "Password is required" };
    }

    // Check password length limits
    const config = SECURITY_CONFIG.PASSWORD;
    if (password.length < config.MIN_LENGTH) {
        return { isValid: false, message: `يجب أن تكون كلمة المرور ${config.MIN_LENGTH} أحرف على الأقل` };
    }

    if (password.length > config.MAX_LENGTH) {
        return { isValid: false, message: "كلمة المرور طويلة جداً" };
    }

    // Use security utils for strength checking
    const strengthCheck = SecurityUtils.checkPasswordStrength(password);
    
    const checks = {
        length: password.length >= config.MIN_LENGTH,
        lowercase: config.REQUIRE_LOWERCASE ? /[a-z]/.test(password) : true,
        uppercase: config.REQUIRE_UPPERCASE ? /[A-Z]/.test(password) : true,
        number: config.REQUIRE_NUMBERS ? /\d/.test(password) : true,
        noSpaces: !/\s/.test(password),
        validChars: new RegExp(`^[A-Za-z\\d${config.ALLOWED_SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]*$`).test(password)
    };

    if (!checks.lowercase) {
        return { isValid: false, message: "يجب أن تحتوي كلمة المرور على حرف صغير" };
    }
    if (!checks.uppercase) {
        return { isValid: false, message: "يجب أن تحتوي كلمة المرور على حرف كبير" };
    }
    if (!checks.number) {
        return { isValid: false, message: "يجب أن تحتوي كلمة المرور على رقم" };
    }
    if (!checks.noSpaces) {
        return { isValid: false, message: "كلمة المرور لا يمكن أن تحتوي على مسافات" };
    }
    if (!checks.validChars) {
        return { isValid: false, message: "كلمة المرور تحتوي على أحرف غير مسموحة" };
    }

    // Return strength information
    return { 
        isValid: true, 
        strength: strengthCheck.strength,
        score: strengthCheck.score
    };
};

// Enhanced OTP validation
export const validateOTP = (otp) => {
    if (!otp || typeof otp !== 'string') return false;
    return /^\d{6}$/.test(otp.trim());
};

// Enhanced input sanitization using security utilities
export const sanitizeInput = (input) => {
    return SecurityUtils.sanitizeInput(input);
};

// Validate name fields
export const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        return { isValid: false, message: "الاسم مطلوب" };
    }

    const trimmed = name.trim();
    if (trimmed.length < 2) {
        return { isValid: false, message: "الاسم يجب أن يكون حرفين على الأقل" };
    }

    if (trimmed.length > 50) {
        return { isValid: false, message: "الاسم طويل جداً" };
    }

    // Allow Arabic and English letters, spaces, and common name characters
    if (!/^[\u0600-\u06FFa-zA-Z\s\-'\.]+$/.test(trimmed)) {
        return { isValid: false, message: "الاسم يحتوي على أحرف غير صحيحة" };
    }

    return { isValid: true };
};

// Validate birth date
export const validateBirthDate = (birthDate) => {
    if (!birthDate) {
        return { isValid: false, message: "تاريخ الميلاد مطلوب" };
    }

    const date = new Date(birthDate);
    const now = new Date();

    if (isNaN(date.getTime())) {
        return { isValid: false, message: "تاريخ الميلاد غير صحيح" };
    }

    if (date > now) {
        return { isValid: false, message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" };
    }

    // Check if user is at least 13 years old
    const minAge = new Date();
    minAge.setFullYear(now.getFullYear() - 13);

    if (date > minAge) {
        return { isValid: false, message: "يجب أن تكون 13 سنة على الأقل" };
    }

    // Check if user is not older than 120 years
    const maxAge = new Date();
    maxAge.setFullYear(now.getFullYear() - 120);

    if (date < maxAge) {
        return { isValid: false, message: "تاريخ الميلاد غير واقعي" };
    }

    return { isValid: true };
};

// Rate limiting for login attempts
export const checkRateLimit = async (identifier) => {
    const limiter = rateLimit({
        interval: 15 * 60 * 1000, // 15 minutes
        uniqueTokenPerInterval: 500,
    });

    try {
        await limiter.check(5, identifier); // 5 attempts per 15 minutes
        return { allowed: true };
    } catch (error) {
        return {
            allowed: false,
            message: "تم تجاوز عدد المحاولات المسموحة، حاول بعد 15 دقيقة"
        };
    }
};


// Validate language code
export const validateLangCode = (langCode) => {
    const validCodes = ['1', '2']; // 1 for Arabic, 2 for English
    return validCodes.includes(langCode);
};