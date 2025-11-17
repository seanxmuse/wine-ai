#!/usr/bin/env node

/**
 * Test GCP Cloud Function proxy
 * Run with: GCP_PROXY_URL=https://your-function-url node scripts/test-gcp-proxy.js
 */

const GCP_PROXY_URL = process.env.GCP_PROXY_URL || 'https://us-central1-wine-scanner-proxy.cloudfunctions.net/winelabs-proxy';

async function testMatchToLwin() {
  console.log('\n🧪 Testing match_to_lwin_batch on GCP...');

  try {
    const response = await fetch(GCP_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'match_to_lwin_batch',
        body: {
          queries: ['Château Margaux 2015', 'Domaine de la Romanée-Conti'],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed:', response.status, error.substring(0, 500));
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Sample response:', JSON.stringify(data.slice(0, 1), null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testPriceStats() {
  console.log('\n🧪 Testing price_stats on GCP...');

  try {
    const response = await fetch(GCP_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'price_stats',
        body: {
          query: 'Château Margaux 2015',
          region: 'world',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed:', response.status, error.substring(0, 500));
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Price stats:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 GCP Cloud Function Proxy Test');
  console.log('===================================');
  console.log('Testing:', GCP_PROXY_URL);
  console.log('\nℹ️  Set GCP_PROXY_URL env var to test your deployed function');

  const results = {
    matchToLwin: await testMatchToLwin(),
    priceStats: await testPriceStats(),
  };

  console.log('\n📊 Test Results:');
  console.log('===================================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('\n✅ All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Update src/services/winelabs.ts to use this GCP URL');
    console.log('2. Deploy to production');
    console.log('3. Test end-to-end wine scanning');
  } else {
    console.log('\n❌ Some tests failed');
    console.log('\nIf you see Cloudflare errors, GCP IPs may also be blocked.');
    console.log('Contact Wine Labs support for IP whitelisting.');
  }

  process.exit(allPassed ? 0 : 1);
}

runTests();
