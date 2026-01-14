import axios from 'axios';
import { config } from './config.js';

/**
 * Generate authentication token from Shiprocket
 * Token is valid for 10 days
 */
export async function getAuthToken() {
  try {
    const response = await axios.post(`${config.baseUrl}/auth/login`, {
      email: config.email,
      password: config.password
    });

    console.log('✅ Authentication successful!');
    console.log('Token:', response.data.token);
    console.log('\nSave this token in your .env file as SHIPROCKET_TOKEN');
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getAuthToken();
}
