export const API_CONFIG = {
    BASE_URL: process.env.API_BASE_URL || 'https://api.lajolie-eg.com/api',
    TIMEOUT: 10000, 
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, 

    ENDPOINTS: {
        LOGIN: '/Auth/login',
        SIGNUP: '/Auth/SignUp',
        VERIFY_OTP: '/Auth/verifyUser',
        SET_PASSWORD: '/Auth/setPassword',
        USER_DATA: '/UserData',
        VERIFY_TOKEN: '/Auth/verify',
        LOGOUT: '/Auth/logout',
        REFRESH_TOKEN: '/Auth/refresh'
    },
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },

};
