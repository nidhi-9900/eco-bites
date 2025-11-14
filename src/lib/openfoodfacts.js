import axios from 'axios';

const OFF_API_BASE = 'https://world.openfoodfacts.org';

// Simple in-memory cache to reduce API calls
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map();

/**
 * Get API key from environment (optional)
 */
function getApiKey() {
  return process.env.OPENFOODFACTS_API_KEY || null;
}

/**
 * Get cache key for a request
 */
function getCacheKey(type, identifier) {
  return `${type}:${identifier}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedData) {
  return cachedData && Date.now() - cachedData.timestamp < CACHE_TTL;
}

/**
 * Search for products by query
 */
export async function searchProducts(query) {
  const cacheKey = getCacheKey('search', query.toLowerCase().trim());
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create request promise
  const requestPromise = (async () => {
    try {
      const apiKey = getApiKey();
      const headers = {
        'User-Agent': 'EcoBites - Sustainable Food Tracker - Contact: your-email@example.com',
      };

      // Add API key to headers if available
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await axios.get(`${OFF_API_BASE}/cgi/search.pl`, {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 20,
          fields: 'code,product_name,brands,image_url,ecoscore_grade,nutriscore_grade',
        },
        headers,
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || !response.data.products) {
        return [];
      }

      const products = response.data.products
        .filter((product) => product.product_name && product.code)
        .map((product) => ({
          id: product.code,
          name: product.product_name || 'Unknown Product',
          brand: product.brands || 'Unknown Brand',
          image: product.image_url || '/placeholder.svg',
          nutriScore: product.nutriscore_grade?.toUpperCase() || null,
          ecoScore: product.ecoscore_grade?.toUpperCase() || null,
        }));

      // Cache the results
      cache.set(cacheKey, {
        data: products,
        timestamp: Date.now(),
      });

      // Remove from pending requests
      pendingRequests.delete(cacheKey);

      return products;
    } catch (error) {
      // Remove from pending requests on error
      pendingRequests.delete(cacheKey);
      
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  })();

  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}

/**
 * Get full product details by ID
 */
export async function getProductById(id) {
  const cacheKey = getCacheKey('product', id);
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create request promise
  const requestPromise = (async () => {
    try {
      const apiKey = getApiKey();
      const headers = {
        'User-Agent': 'EcoBites - Sustainable Food Tracker - Contact: your-email@example.com',
      };

      // Add API key to headers if available
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await axios.get(`${OFF_API_BASE}/api/v0/product/${id}.json`, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || response.data.status === 0) {
        throw new Error('Product not found');
      }

      const product = normalizeProductData(response.data.product);

      // Cache the result (products don't change often, cache longer)
      cache.set(cacheKey, {
        data: product,
        timestamp: Date.now(),
      });

      // Remove from pending requests
      pendingRequests.delete(cacheKey);

      return product;
    } catch (error) {
      // Remove from pending requests on error
      pendingRequests.delete(cacheKey);
      
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product details');
    }
  })();

  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}

/**
 * Normalize OpenFoodFacts data to uniform schema
 */
function normalizeProductData(product) {
  // Extract nutrition values
  const nutrition = product.nutriments || {};
  
  // Extract additives
  const additives = product.additives_tags
    ? product.additives_tags.map((tag) => tag.replace('en:', '').toUpperCase())
    : [];

  // Extract packaging
  const packaging = product.packaging_tags
    ? product.packaging_tags.map((tag) => tag.replace('en:', '').replace(/-/g, ' '))
    : [];

  // Extract carbon footprint if available
  const carbonFootprint = product.ecoscore_data?.agribalyse?.co2_total
    ? parseFloat(product.ecoscore_data.agribalyse.co2_total)
    : null;

  return {
    id: product.code || product._id,
    name: product.product_name || product.abbreviated_product_name || 'Unknown Product',
    brand: product.brands || 'Unknown Brand',
    image: product.image_url || product.image_front_url || '/placeholder.svg',
    nutriScore: product.nutriscore_grade?.toUpperCase() || null,
    ecoScore: product.ecoscore_grade?.toUpperCase() || null,
    additives,
    nutrition: {
      energy: nutrition['energy-kcal_100g'] || nutrition.energy_100g || 0,
      fat: nutrition.fat_100g || 0,
      sugars: nutrition.sugars_100g || 0,
      salt: nutrition.salt_100g || 0,
      protein: nutrition.proteins_100g || 0,
      saturatedFat: nutrition['saturated-fat_100g'] || 0,
      fiber: nutrition.fiber_100g || 0,
      sodium: nutrition.sodium_100g || 0,
    },
    packaging,
    carbonFootprint,
    ingredients: product.ingredients_text || 'No ingredients listed',
    categories: product.categories_tags
      ? product.categories_tags.map((tag) => tag.replace('en:', '').replace(/-/g, ' '))
      : [],
  };
}

