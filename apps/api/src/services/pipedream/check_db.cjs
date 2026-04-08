const { db } = require('../../shared/db.js');
const { pipedreamApps } = require('@repo/database');

async function checkApps() {
  try {
    const apps = await db.select().from(pipedreamApps).limit(10);
    console.log('--- DB APPS ---');
    console.log(JSON.stringify(apps, null, 2));
  } catch (err) {
    console.error('Check failed:', err.message);
  }
  process.exit(0);
}

checkApps();
