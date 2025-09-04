// lib/api/client.js
import { cache } from 'react';

class OptimizedApiClient {
  constructor() {
    this.baseURL = 'https://upupapi.geniussystemapi.com/api';
    this.cache = new Map();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Cached request method for server components
  cachedRequest = cache(async (url, options = {}) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        next: { revalidate: 300, tags: ['products', 'categories'] }, // 5min cache
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  });

  // Client-side request with proper error handling
  async clientRequest(url, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Client API request failed:', error);
      throw error;
    }
  }

  // Server-side methods (cached)
  async getCategoryFilters(categoryId, locale = 'en') {
    const langCode = locale === 'en' ? '2' : '1';
    return this.cachedRequest(
      `${this.baseURL}/AdvancedSearch/getBasicData?categoryId=${categoryId}`,
      {
        headers: { langCode },
        next: { revalidate: 3600, tags: [`category-${categoryId}`] }, // 1hr cache
      }
    );
  }

  async getFilteredProducts(filters, locale = 'en') {
    const langCode = locale === 'en' ? '2' : '1';
    
    console.log('Server getFilteredProducts - sending filters in body:', filters);
    
    return this.cachedRequest(
      `${this.baseURL}/AdvancedSearch/getFilteredProducts`,
      {
        method: 'POST',
        body: JSON.stringify(filters),
        headers: { 
          'Content-Type': 'application/json',
          langCode 
        },
        next: { revalidate: 180, tags: [`products-${filters.categoryId}`] }, // 3min cache
      }
    );
  }

  // Client-side methods (non-cached, for interactions)
  async clientGetFilteredProducts(filters, locale = 'en') {
    const langCode = locale === 'en' ? '2' : '1';
    
    console.log('Client getFilteredProducts - sending filters in body:', filters);
    
    return this.clientRequest(`${this.baseURL}/AdvancedSearch/getFilteredProducts`, {
      method: 'POST',
      body: JSON.stringify(filters),
      headers: { 
        'Content-Type': 'application/json',
        langCode 
      },
    });
  }
}

export const apiClient = new OptimizedApiClient();