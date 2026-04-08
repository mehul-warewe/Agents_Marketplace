import axios from 'axios';
import { credentials } from '@repo/database';
import { db } from '../../../shared/db.js';
import { encryptCredential } from '../../../shared/encryption.js';

export const initiateSlackOAuth = (userId: string, apiBaseUrl: string) => {
  const { SLACK_CLIENT_ID } = process.env;
  const redirectUri = `${apiBaseUrl}/credentials/oauth/slack/callback`;
  const state = JSON.stringify({ userId });
  const scopes = 'chat:write,chat:write.public,users:read,channels:read';

  return `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
};

export const handleSlackCallback = async (code: string, state: string, apiBaseUrl: string) => {
  const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } = process.env;
  const { userId } = JSON.parse(state);
  const redirectUri = `${apiBaseUrl}/credentials/oauth/slack/callback`;

  const tokenRes = await axios.post('https://slack.com/api/oauth.v2.access', new URLSearchParams({
    code,
    client_id: SLACK_CLIENT_ID!,
    client_secret: SLACK_CLIENT_SECRET!,
    redirect_uri: redirectUri,
  }));

  if (!tokenRes.data.ok) throw new Error(`Slack OAuth error: ${tokenRes.data.error}`);

  const { authed_user } = tokenRes.data;
  const encryptedData = encryptCredential({
    accessToken: authed_user.access_token,
    userId: authed_user.id,
  });

  const [newCred] = await db.insert(credentials).values({
    userId,
    name: `Slack (${tokenRes.data.team.name})`,
    type: 'slack_oauth',
    data: encryptedData,
    isValid: true,
  }).returning();

  return newCred;
};
