import axios from 'axios';
import { config } from './config.js';
import { getAuthToken } from './auth.js';

let cachedToken = null;

/**
 * Create an authenticated axios instance
 */
export async function getApiClient() {
  if (!cachedToken) {
    cachedToken = await getAuthToken();
  }

  return axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cachedToken}`
    }
  });
}

/**
 * Make authenticated API request
 */
export async function apiRequest(method, endpoint, data = null) {
  const client = await getApiClient();
  
  try {
    const response = await client({ method, url: endpoint, data });
    return response.data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
}
