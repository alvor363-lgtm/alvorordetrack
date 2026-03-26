/**
 * Stress test for https://ordetrack.netlify.app/
 * Run: node stress-test.js
 */
const https = require('https');
const url = 'https://ordetrack.netlify.app/';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, time: Date.now() - start }));
    }).on('error', (err) => reject(err));
  });
}

async function runStressTest(total = 100, concurrency = 20) {
  console.log(`\n=== Stress Test: ${url} ===`);
  console.log(`Requests: ${total} | Concurrency: ${concurrency}\n`);

  const results = { success: 0, failed: 0, times: [] };
  const startAll = Date.now();

  const runBatch = async (batch) => {
    const promises = batch.map(() =>
      fetch(url).then(r => {
        results.success++;
        results.times.push(r.time);
        return r;
      }).catch(() => {
        results.failed++;
        return null;
      })
    );
    await Promise.all(promises);
  };

  const batches = [];
  for (let i = 0; i < total; i += concurrency) {
    batches.push(Array(concurrency).fill(0).map((_, j) => i + j).filter(n => n < total));
  }

  for (const batch of batches) {
    await runBatch(batch);
  }

  const totalTime = Date.now() - startAll;
  const times = results.times.filter(Boolean).sort((a, b) => a - b);

  console.log('--- Results ---');
  console.log(`Total requests: ${total}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success rate: ${((results.success / total) * 100).toFixed(1)}%`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Requests/sec: ${(total / (totalTime / 1000)).toFixed(1)}`);
  if (times.length) {
    console.log(`Min response: ${Math.min(...times)}ms`);
    console.log(`Max response: ${Math.max(...times)}ms`);
    console.log(`Avg response: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(0)}ms`);
    console.log(`P50 (median): ${times[Math.floor(times.length / 2)]}ms`);
    console.log(`P95: ${times[Math.floor(times.length * 0.95)] || times[times.length - 1]}ms`);
  }
  console.log('\n');
}

runStressTest(100, 25).catch(console.error);
