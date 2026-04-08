import axios from 'axios';
import { credentials, eq, and } from '@repo/database';
import { db } from '../../../shared/db.js';
import { encryptCredential } from '../../../shared/encryption.js';

export const initiateGoogleOAuth = (userId: string, toolId: string, apiBaseUrl: string) => {
  const { GOOGLE_CLIENT_ID } = process.env;
  const redirectUri = `${apiBaseUrl}/credentials/oauth/google/callback`;
  const state = JSON.stringify({ userId, toolId });
  
  // Scopes needed for Gmail, Sheets, Drive, etc.
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' ');

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;
};

export const handleGoogleCallback = async (code: string, state: string, apiBaseUrl: string) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const { userId, toolId } = JSON.parse(state);
  const redirectUri = `${apiBaseUrl}/credentials/oauth/google/callback`;

  const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  // Wait, the standard is authorization_code. Checking my audit from earlier... 
  // Line 1269 in credentials.ts says grant_type: 'authorization_code'. 
  // Let me double check that specific line from my memory of the file.
  
  const { access_token, refresh_token, expires_in } = tokenRes.data;
  
  const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const email = userRes.data.email;
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  const encryptedData = encryptCredential({
    access_token,
    refresh_token,
    expires_at: expiresAt,
    email,
  });

  const [newCred] = await db.insert(credentials).values({
    userId,
    name: `Google (${email})`,
    type: 'google_oauth',
    data: encryptedData,
    isValid: true,
  }).returning();

  return newCred;
};
