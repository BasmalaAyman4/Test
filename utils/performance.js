
// utils/performance.js (Performance utilities)
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Intersection Observer utility for lazy loading
export const useIntersectionObserver = (callback, options = {}) => {
    const [ref, setRef] = useState(null);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(callback, {
            threshold: 0.1,
            ...options,
        });

        observer.observe(ref);

        return () => observer.disconnect();
    }, [ref, callback, options]);

    return setRef;
};

// Cache utilities for client-side caching
export const createMemoryCache = (maxSize = 100) => {
    const cache = new Map();

    return {
        get: (key) => cache.get(key),
        set: (key, value) => {
            if (cache.size >= maxSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            cache.set(key, value);
        },
        has: (key) => cache.has(key),
        delete: (key) => cache.delete(key),
        clear: () => cache.clear(),
        size: () => cache.size,
    };
};

// Product image optimization utilities
export const getOptimizedImageUrl = (url, width, height, quality = 75) => {
    if (!url) return '';

    // If using Next.js Image Optimization API
    const params = new URLSearchParams({
        url: encodeURIComponent(url),
        w: width,
        h: height,
        q: quality,
    });

    return `/_next/image?${params.toString()}`;
};

export const getImageSrcSet = (url, sizes = [400, 800, 1200]) => {
    if (!url) return '';

    return sizes
        .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
        .join(', ');
};

// Price formatting utilities with caching
const priceFormatters = new Map();

export const getCachedPriceFormatter = (locale) => {
    if (!priceFormatters.has(locale)) {
        priceFormatters.set(locale, new Intl.NumberFormat(
            locale === 'en' ? 'en-US' : 'ar-EG',
            {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        ));
    }
    return priceFormatters.get(locale);
};