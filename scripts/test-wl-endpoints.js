const USER_ID = 'd71dd0cb-2f37-4db5-8f7a-6937720852da';

async function testEndpoints() {
  const bases = [
    'https://winelabs.ai/api',
    'https://api.winelabs.ai',
    'https://winelabs.ai/v1',
  ];

  const endpoints = ['match_to_lwin_batch', 'price_stats'];

  for (const base of bases) {
    for (const endpoint of endpoints) {
      const url = `${base}/${endpoint}`;
      console.log(`\nTesting: ${url}`);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({user_id: USER_ID, queries: ['test']}),
        });

        console.log(`  Status: ${response.status}`);
        const matchedPath = response.headers.get('x-matched-path');
        if (matchedPath) {
          console.log(`  x-matched-path: ${matchedPath}`);
        }

        if (response.status !== 404 && response.status !== 405) {
          const text = await response.text();
          console.log(`  Response: ${text.substring(0, 200)}`);
        }
      } catch (e) {
        console.log(`  Error: ${e.message}`);
      }
    }
  }
}

testEndpoints();
