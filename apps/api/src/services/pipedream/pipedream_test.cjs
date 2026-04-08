const path = require('path');
const fs = require('fs');

// Simple .env parser to avoid dependency
function loadEnv() {
  // Try several locations for .env
  const locations = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../../../.env'), // From apps/api/src/services/pipedream
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../../.env')
  ];
  
  for (const envPath of locations) {
    if (fs.existsSync(envPath)) {
      console.log('Using .env at:', envPath);
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });
      return;
    }
  }
  console.error('Could not find .env file in any suspected location.');
}

loadEnv();

async function testPipedreamConnect() {
  const { 
    PIPEDREAM_CLIENT_ID: clientId, 
    PIPEDREAM_CLIENT_SECRET: clientSecret, 
    PIPEDREAM_PROJECT_ID: projectId 
  } = process.env;

  if (!clientId || !clientSecret || !projectId) {
    console.error('Missing Pipedream credentials in .env');
    console.log('Env Check:', { 
      clientId: !!clientId, 
      clientSecret: !!clientSecret, 
      projectId: !!projectId 
    });
    process.exit(1);
  }

  const appSlug = 'google_sheets';
  const externalUserId = 'test-user-' + Date.now();
  const environment = 'development';

  console.log('\n--- PIPEDREAM CONNECT TEST ---');
  console.log(`Project: ${projectId}`);
  console.log(`App: ${appSlug}\n`);

  try {
    // 1. Get OAuth Token
    console.log('Fetching OAuth token...');
    const authRes = await fetch('https://api.pipedream.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    const authData = await authRes.json();
    if (!authData.access_token) {
        throw new Error('Could not get access token: ' + JSON.stringify(authData));
    }
    const accessToken = authData.access_token;

    // 2. Generate Connect Token
    console.log('Generating Connect Token...');
    const res = await fetch(`https://api.pipedream.com/v1/connect/${projectId}/tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-pd-environment': environment
      },
      body: JSON.stringify({ 
        external_user_id: externalUserId, 
        app_slug: appSlug 
      })
    });

    const data = await res.json();
    console.log('API Response Body:', JSON.stringify(data, null, 2));

    const token = data.token;
    if (!token) throw new Error('No token returned from Pipedream API');

    let connectLinkUrl = data.connect_link_url || data.connect_url;
    
    // Core logic: Ensure app parameter is present
    if (!connectLinkUrl) {
      connectLinkUrl = `https://pipedream.com/_static/connect.html?token=${token}&connectLink=true&app=${appSlug}`;
    } else if (appSlug && !connectLinkUrl.includes('app=')) {
        const separator = connectLinkUrl.includes('?') ? '&' : '?';
        connectLinkUrl += `${separator}app=${appSlug}&connectLink=true`;
    }

    console.log('\n--- SUCCESS ---');
    console.log('Final Connection URL:');
    console.log(connectLinkUrl);
    console.log('\nCopy and paste this URL into your browser to test.');

  } catch (err) {
    console.error('\n--- FAILED ---');
    console.error('Error:', err.message);
  }
}

testPipedreamConnect();
