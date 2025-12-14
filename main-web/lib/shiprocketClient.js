export async function getShiprocketToken() {
    const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    if (!email || !password) throw new Error('Missing Shiprocket credentials');
  
    const resp = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.message || JSON.stringify(json));
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
  