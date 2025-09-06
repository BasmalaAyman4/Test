// lib/api-optimized.js
import { endpoints } from '@/lib/api/endpoints';

// Cache configuration
const CACHE_CONFIG = {
    home: 300, // 5 minutes
    product: 600, // 10 minutes
    productBundle: 300, // 5 minutes
    advancedSearch: 60, // 1 minute
};

// Request timeout configuration
const TIMEOUT_CONFIG = {
    default: 10000, // 10 seconds
    upload: 30000, // 30 seconds for file uploads
};

// Error types for better error handling
export const API_ERRORS = {
    TIMEOUT: 'TIMEOUT',
    NETWORK: 'NETWORK',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
};

class APIError extends Error {
    constructor(message, type, status = null, details = null) {
        super(message);
        this.name = 'APIError';
        this.type = type;
        this.status = status;
        this.details = details;
    }
}

// Enhanced request function with better error handling and performance
const serverRequest = async (url, options = {}) => {
    const { timeout = TIMEOUT_CONFIG.default, retries = 1, ...fetchOptions } = options;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    const config = {
        signal: controller.signal,
        ...fetchOptions,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NextJS-Server/1.0',
            ...fetchOptions.headers,
        }
    };

    let lastError;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`🔍 API Request (attempt ${attempt + 1}/${retries + 1}):`, url);

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle different HTTP status codes
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                let errorType = API_ERRORS.SERVER_ERROR;

                try {
                    const errorData = await response.text();
                    errorMessage = `HTTP ${response.status}: ${errorData}`;
                } catch (e) {
                    // Ignore error parsing response body
                }

                switch (response.status) {
                    case 404:
                        errorType = API_ERRORS.NOT_FOUND;
                        break;
                    case 408:
                    case 504:
                        errorType = API_ERRORS.TIMEOUT;
                        break;
                    default:
                        if (response.status >= 500) {
                            errorType = API_ERRORS.SERVER_ERROR;
                        }
                }

                throw new APIError(errorMessage, errorType, response.status);
            }

            const data = await response.json();
            console.log('✅ API Success:', { url, dataKeys: Object.keys(data || {}) });
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;

            // Don't retry for certain error types
            if (error.name === 'AbortError') {
                throw new APIError('Request timeout', API_ERRORS.TIMEOUT);
            }

            if (error instanceof APIError && error.type === API_ERRORS.NOT_FOUND) {
                throw error; // Don't retry 404s
            }

            if (error.message === 'fetch failed') {
                lastError = new APIError(
                    'Network error - Unable to connect to API',
                    API_ERRORS.NETWORK
                );
            }

            // If this is the last attempt, throw the error
            if (attempt === retries) {
                throw lastError instanceof APIError ? lastError : new APIError(
                    lastError.message || 'Unknown error',
                    API_ERRORS.SERVER_ERROR
                );
            }

            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Enhanced GET request with caching
export const serverGet = (url, options = {}) => {
    const { cacheTime, ...restOptions } = options;

    return serverRequest(url, {
        method: 'GET',
        next: {
            revalidate: cacheTime || CACHE_CONFIG.default,
            tags: [url] // For revalidation
        },
        ...restOptions
    });
};

// POST request
export const serverPost = (url, body, options = {}) => serverRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    timeout: TIMEOUT_CONFIG.upload,
    ...options
});

// PUT request
export const serverPut = (url, body, options = {}) => serverRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
});

// DELETE request
export const serverDelete = (url, options = {}) => serverRequest(url, {
    method: 'DELETE',
    ...options
});

// Utility function to get language headers
const getLangHeaders = (locale) => ({
    'langCode': locale === 'en' ? '2' : '1',
    'Accept-Language': locale === 'en' ? 'en-US' : 'ar-EG',
});

// API functions with optimized caching and error handling
export const serverGetHome = async (locale) => {
    try {
        return await serverGet(endpoints.home, {
            headers: getLangHeaders(locale),
            cacheTime: CACHE_CONFIG.home,
        });
    } catch (error) {
        console.error('❌ Failed to fetch home data:', error);
        throw error;
    }
};

export const serverGetProductBundle = async (locale, pageNo = 1, pageSize = 20) => {
    try {
        const url = `${endpoints.productBundle}&pageNo=${pageNo}&pageSize=${pageSize}`;
        return await serverGet(url, {
            headers: getLangHeaders(locale),
            cacheTime: CACHE_CONFIG.productBundle,
        });
    } catch (error) {
        console.error('❌ Failed to fetch product bundle:', error);
        throw error;
    }
};

export const serverGetAdvancedSearch = async (locale, filters = {}) => {
    try {
        const searchParams = new URLSearchParams(filters);
        const url = `${endpoints.advancedSearch}${searchParams.toString() ? `?${searchParams}` : ''}`;

        return await serverGet(url, {
            headers: getLangHeaders(locale),
            cacheTime: CACHE_CONFIG.advancedSearch,
        });
    } catch (error) {
        console.error('❌ Failed to fetch search results:', error);
        throw error;
    }
};

export const serverGetProductById = async (id, locale) => {
    if (!id || isNaN(Number(id))) {
        throw new APIError('Invalid product ID', API_ERRORS.INVALID_RESPONSE);
    }

    try {
        const data = await serverGet(endpoints.productById(id), {
            headers: getLangHeaders(locale),
            cacheTime: CACHE_CONFIG.product,
        });

        // Validate product data structure
        if (!data || typeof data !== 'object') {
            throw new APIError('Invalid product data received', API_ERRORS.INVALID_RESPONSE);
        }

        // Ensure required fields exist
        if (!data.productId || !data.name) {
            throw new APIError('Product data is incomplete', API_ERRORS.INVALID_RESPONSE);
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        console.error(`❌ Failed to fetch product ${id}:`, error);
        throw new APIError('Failed to fetch product details', API_ERRORS.SERVER_ERROR);
    }
};

// Client-side API functions (for use in components)
export const clientRequest = async (url, options = {}) => {
    const { timeout = 8000, retries = 2, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
        signal: controller.signal,
        headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
        },
        ...fetchOptions,
    };

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new APIError(`HTTP ${response.status}`, API_ERRORS.SERVER_ERROR, response.status);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;

            if (error.name === 'AbortError') {
                throw new APIError('Request timeout', API_ERRORS.TIMEOUT);
            }

            if (attempt === retries) {
                throw lastError instanceof APIError ? lastError : new APIError(
                    'Request failed',
                    API_ERRORS.NETWORK
                );
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
};

// Client-side GET request
export const clientGet = (url, options = {}) => clientRequest(url, {
    method: 'GET',
    ...options
});

// Client-side POST request
export const clientPost = (url, body, options = {}) => clientRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options
});

// Utility functions for data transformation and validation
export const validateProductData = (product) => {
    const errors = [];

    if (!product) {
        errors.push('Product data is null or undefined');
        return { isValid: false, errors };
    }

    if (!product.productId) errors.push('Missing productId');
    if (!product.name) errors.push('Missing product name');
    if (!product.colors || !Array.isArray(product.colors)) {
        errors.push('Missing or invalid colors array');
    } else if (product.colors.length === 0) {
        errors.push('Product has no color variants');
    }

    // Validate color data
    product.colors?.forEach((color, index) => {
        if (!color.colorId) errors.push(`Color ${index}: Missing colorId`);
        if (!color.name) errors.push(`Color ${index}: Missing color name`);
        if (!color.sizes || !Array.isArray(color.sizes)) {
            errors.push(`Color ${index}: Missing or invalid sizes array`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Format price with locale support
export const formatPrice = (price, locale = 'ar') => {
    if (typeof price !== 'number' || price < 0) return '0';

    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
};

// Get available sizes for a color
export const getAvailableSizes = (color) => {
    if (!color?.sizes) return [];
    return color.sizes;
};

// Get best price (discount or regular)
export const getBestPrice = (size, color) => {
    const sizePrice = size?.discountPrice > 0 ? size.discountPrice : size?.salesPrice;
    const colorPrice = color?.discountPrice > 0 ? color.discountPrice : color?.salesPrice;
    return sizePrice || colorPrice || 0;
};

// Check if product/variant is in stock
export const isInStock = (size) => {
    return size && size.qty > 0 && size.salesPrice > 0;
};

// Generate product SEO data
export const generateProductSEO = (product, locale = 'ar') => {
    if (!product) return {};

    const title = `${product.name} | ${product.brand || ''}`.trim();
    const description = product.description
        ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
        : `${product.name} from ${product.brand || 'our store'}`;

    const images = product.colors?.[0]?.productImages || [];
    const primaryImage = images.find(img => img.isPrimary) || images[0];

    return {
        title,
        description,
        keywords: [
            product.name,
            product.brand,
            product.category,
            product.productTypeName,
            ...(product.colors?.map(c => c.name) || [])
        ].filter(Boolean).join(', '),
        openGraph: {
            title,
            description,
            type: 'website', // Changed from 'product' to 'website'
            images: primaryImage ? [{
                url: primaryImage.fileLink,
                width: 800,
                height: 600,
                alt: product.name
            }] : [],
            siteName: 'Lajolie',
        },
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            brand: product.brand,
            category: product.category,
            description,
            image: primaryImage?.fileLink,
            offers: {
                '@type': 'Offer',
                price: getBestPrice(product.colors?.[0]?.sizes?.[0], product.colors?.[0]),
                priceCurrency: 'EGP',
                availability: isInStock(product.colors?.[0]?.sizes?.[0])
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock'
            }
        }
    };
};

export { APIError };