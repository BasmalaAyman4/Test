import { endpoints } from './endpoints';
const serverRequest = async (url, options = {}) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Server/1.0',
      },
      signal: AbortSignal.timeout(10000), 
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Server/1.0',
        ...options.headers,
      }
    };

    console.log('🔍 Config:', JSON.stringify(config, null, 2));

    const response = await fetch(url, config);
            
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success:', data);
    return data;
  } catch (error) {
    console.error('❌ Server API request failed:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - API took too long to respond');
    }
        if (error.message === 'fetch failed') {
      throw new Error('Network error - Unable to connect to API. Check if the API is accessible and HTTPS is properly configured.');
    }
    
    throw error;
  }
};

export const serverGet = (url, options = {}) => serverRequest(url, {
  method: 'GET',
  next: { revalidate: 300 }, 
  ...options
});

export const serverPost = (url, body, options = {}) => serverRequest(url, {
  method: 'POST',
  body: JSON.stringify(body),
  ...options
});


export const serverGetBanner = (locale) => {  
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.banners, {
    headers: {
      'langCode': langCode,
    }
  });
};

export const serverGetCategories = (locale) => {  
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.categories, {
    headers: {
      'langCode': langCode,
    }
  });
};
export const serverGetTrendingProducts = (locale ,type = 'bestSeller') => {  
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints[type], {
    headers: {
      'langCode': langCode,
    }
  });
};



export const serverGetProductById = (id, locale) => {
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.productById(id), {
    headers: {
      'langCode': langCode,
    }
  });
};

export const serverGetSocial = (locale) => {
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.social, {
    headers: {
      'langCode': langCode,
    }
  });
};

export const serverGetPolicies = (locale) => {
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.plocies, {
    headers: {
      'langCode': langCode,
    }
  });
};


export const serverGetGovernorate = (locale) => {
  const langCode = locale === 'en' ? '2' : '1';
  return serverGet(endpoints.checkout.governorate, {
    headers: {
      'langCode': langCode,
    }
  });
};




































/* export const serverGetCategoryById = (id) => serverGet(endpoints.categoryById(id));

export const serverGetCategoryProducts = (id, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString 
    ? `${endpoints.categoryProducts(id)}?${queryString}`
    : endpoints.categoryProducts(id);
  return serverGet(url);
};

// Server API functions for products
export const serverGetProducts = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString 
    ? `${endpoints.products}?${queryString}`
    : endpoints.products;
  return serverGet(url);
};

export const serverGetProductById = (id) => serverGet(endpoints.productById(id));

export const serverSearchProducts = (query, params = {}) => {
  const searchParams = new URLSearchParams({ q: query, ...params });
  return serverGet(`${endpoints.productSearch}?${searchParams}`);
}; */