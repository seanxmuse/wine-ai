#!/usr/bin/env node

/**
 * Test Wine Labs API directly (will likely be blocked by Cloudflare locally)
 */

const USER_ID = 'd71dd0cb-2f37-4db5-8f7a-6937720852da';

async function testDirect() {
  console.log('Testing Wine Labs API directly...\n');

  try {
    const response = await fetch('https://winelabs.ai/api/match_to_lwin_batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        user_id: USER_ID,
        queries: ['Château Margaux 2015', 'Opus One 2018'],
      }),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('\nResponse:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('\nResponse (first 500 chars):', text.substring(0, 500));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirect();
