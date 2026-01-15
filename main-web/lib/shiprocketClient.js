// Token cache to avoid repeated logins
let cachedToken = null;
let tokenExpiry = null;

export async function getShiprocketToken() {
    // Return cached token if still valid (tokens are valid for 24 hours)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      console.log('Using cached Shiprocket token');
      return cachedToken;
    }
    
    const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    
    console.log('Shiprocket credentials check:');
    console.log('- Email:', email);
    console.log('- Password length:', password?.length);
    console.log('- Password first 10 chars:', password?.substring(0, 10));
    
    if (!email || !password) throw new Error('Missing Shiprocket credentials');
  
    const resp = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await resp.json();
    
    console.log('Shiprocket auth response:', json);
    
    if (!resp.ok) throw new Error(json.message || JSON.stringify(json));
    
    // Cache the token for 23 hours (tokens are valid for 24 hours)
    cachedToken = json.token;
    tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
    console.log('Token cached until:', new Date(tokenExpiry).toISOString());
    
    return json.token;
  }
  
  export async function shiprocketFetch(path, options = {}) {
    const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const token = await getShiprocketToken();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };
  
    const res = await fetch(`${base}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || JSON.stringify(data));
    return data;
  }
  