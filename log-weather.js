// log-weather.js
// Run with: node log-weather.js
// Fetches the current weather snapshot and appends it to weather-log.json
// (creating the file if it doesn't exist yet).

const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://arcaneangler.com/api/game/weather';
const LOG_FILE = path.join(__dirname, 'weather-log.json');

async function main() {
  let res;
  try {
    res = await fetch(ENDPOINT, { cache: 'no-store' });
  } catch (e) {
    console.error('Fetch failed:', e.message);
    process.exit(1); // non-zero so the Actions run shows as failed (easy to spot in the log)
  }

  if (!res.ok) {
    console.error(`Non-OK status: ${res.status}`);
    process.exit(1);
  }

  const text = await res.text();
  if (!text) {
    console.warn('Empty body received, skipping this run.');
    return; // exit 0 — not a real failure, just the known intermittent glitch
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }

  const weatherMap = json.weather || {};

  // Load existing log (or start a new one)
  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (e) {
      console.warn('Existing log was corrupted, starting fresh.');
      log = [];
    }
  }

  const last = log[log.length - 1];
  const changed = !last || JSON.stringify(last.data) !== JSON.stringify(weatherMap);

  if (changed) {
    const entry = {
      time: Date.now(),
      iso: new Date().toISOString(),
      data: weatherMap,
    };
    log.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
    console.log(`Recorded change @ ${entry.iso}`);
  } else {
    console.log(`No change @ ${new Date().toISOString()}`);
  }
}

main();
