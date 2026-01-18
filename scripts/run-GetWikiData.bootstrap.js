// scripts/run-getWikiData.bootstrap.js
// Plain Node (CJS) bootstrap that enables ts-node then runs the TS function.

try {
  // Register ts-node so we can require TypeScript modules
  require('ts-node').register({
    transpileOnly: true,
    // Optionally set project: './tsconfig.json'
  });
} catch {
  console.error('ts-node is required to run this script. Install with: npm i -D ts-node');
  process.exit(1);
}

async function run() {
  try {
    // require your TypeScript module (CJS require works since ts-node is registered)
    const mod = require('../app/getWikiData');
    const getWikiData = (mod.default ?? mod.getWikiData);

    if (typeof getWikiData !== 'function') {
      throw new Error('getWikiData export not found in ../app/getWikiData');
    }

    const titles = ['Mona Lisa', 'Eiffel Tower', 'Mount Everest'];
    for (const title of titles) {
      console.log(`\n--- Fetching (bootstrap): ${title} ---`);
      const data = await getWikiData(title, 'en');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error in bootstrap:', err);
    process.exit(1);
  }
}

run();