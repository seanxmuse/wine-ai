/**
 * Google Cloud Function - Wine Labs API Proxy
 *
 * Deploy with:
 * gcloud functions deploy winelabs-proxy \
 *   --runtime nodejs20 \
 *   --trigger-http \
 *   --allow-unauthenticated \
 *   --set-env-vars WINELABS_API_KEY=your-key,WINELABS_USER_ID=your-id \
 *   --region us-central1
 */

const WINELABS_API_BASE = 'https://external-api.wine-labs.com';

exports.winelabsProxy = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { endpoint, body } = req.body;

    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint is required' });
      return;
    }

    // Get credentials from environment
    const API_KEY = process.env.WINELABS_API_KEY || '';
    const USER_ID = process.env.WINELABS_USER_ID || '';

    // Add user_id to request body
    const requestBody = {
      ...body,
      user_id: USER_ID,
    };

    // Headers to bypass Cloudflare
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://winelabs.ai/',
      'Origin': 'https://winelabs.ai',
    };

    if (API_KEY) {
      headers['X-API-Key'] = API_KEY;
    }

    console.log(`[GCP] Calling Wine Labs API: ${endpoint}`);

    const response = await fetch(`${WINELABS_API_BASE}/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GCP] Wine Labs error: ${response.status} ${response.statusText}`);
      res.status(response.status).json({
        error: `Wine Labs API error: ${response.statusText}`,
        details: errorText,
      });
      return;
    }

    const data = await response.json();
    console.log(`[GCP] Wine Labs success: ${endpoint}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('[GCP] Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
